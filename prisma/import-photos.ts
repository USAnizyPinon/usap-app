/**
 * IMPORT DES PHOTOS EN MASSE
 * ---------------------------------------------------------------
 * Dépose tes photos dans le dossier  photos-a-importer/  puis lance :
 *
 *   npm run db:photos          → aperçu, rien n'est modifié
 *   npm run db:photos -- --go  → applique réellement les changements
 *
 * Le nom du fichier suffit : « MAHU Clement.jpg », « clement-mahu.png »,
 * « 1781_Clément_MAHU_SENIOR.jpeg » désignent la même personne.
 * Accents, majuscules, tirets, ordre prénom/nom et petites fautes de
 * frappe sont tolérés. Une photo qui ne correspond à personne est ignorée.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const DOSSIER = process.argv.find((a) => a.startsWith("--dossier="))?.split("=")[1]
  ?? "photos-a-importer";
const APPLIQUER = process.argv.includes("--go");

/* ============================================================
   Lecture du fichier .env (sans dépendance supplémentaire)
   ============================================================ */
function chargerEnv() {
  const f = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(f)) return;
  for (const ligne of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const valeur = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = valeur;
  }
}
chargerEnv();

/* ============================================================
   Comparaison souple des noms
   ============================================================ */

/** Enlève accents, ponctuation et majuscules. */
function normaliser(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// Mots à ignorer dans un nom de fichier : catégories, mentions diverses
const BRUIT = new Set([
  "photo", "photos", "img", "image", "dsc", "screenshot", "capture", "portrait",
  "usap", "anizy", "pinon", "club", "membre", "membres", "du", "de", "des", "la", "le",
  "bureau", "comite", "dirigeant", "dirigeants", "coach", "coachs", "educateur",
  "educatrice", "entraineur", "entraineuse", "staff", "joueur", "joueuse", "joueurs",
  "senior", "seniors", "veteran", "veterans", "feminine", "feminines", "feminin",
  "pole", "jeune", "jeunes", "equipe", "saison", "copie", "final", "def",
  "u", "us", "fc", "as",
]);

/** Ne conserve que les mots susceptibles d'être un prénom ou un nom. */
function motsUtiles(texte: string) {
  return normaliser(texte)
    .split(" ")
    .filter((m) => m.length >= 2 && !BRUIT.has(m) && !/^u\d+$/.test(m));
}

/** Clé indépendante de l'ordre : « mahu clement » = « clement mahu ». */
function cle(texte: string) {
  return motsUtiles(texte).sort().join(" ");
}

/** Distance de Levenshtein : nombre de corrections pour passer de a à b. */
function distance(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0 || n === 0) return Math.max(m, n);
  let prec = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cour = [i];
    for (let j = 1; j <= n; j++) {
      cour[j] = Math.min(
        prec[j] + 1,
        cour[j - 1] + 1,
        prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prec = cour;
  }
  return prec[n];
}

/** Tolérance : plus le nom est long, plus on accepte d'écart. */
function tolerance(longueur: number) {
  if (longueur <= 6) return 0;
  if (longueur <= 12) return 1;
  if (longueur <= 20) return 2;
  return 3;
}

/* ============================================================
   Dépôt de la photo sur Supabase
   ============================================================ */
const BUCKET = "photos";

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY doivent être renseignés dans .env"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

async function deposer(fichier: string, nomPersonne: string) {
  const ext = path.extname(fichier).toLowerCase();
  const slug = normaliser(nomPersonne).replace(/ /g, "-") || "photo";
  const nom = `${slug}-${Date.now()}${ext}`;

  const { error } = await supabase()
    .storage.from(BUCKET)
    .upload(nom, fs.readFileSync(fichier), {
      contentType: TYPES[ext],
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) throw new Error(error.message);

  return supabase().storage.from(BUCKET).getPublicUrl(nom).data.publicUrl;
}

/* ============================================================
   Programme
   ============================================================ */

type Fiche = {
  id: string;
  type: "joueur" | "encadrant" | "bureau";
  nom: string;
  detail: string;
  cle: string;
};

async function main() {
  const racine = path.resolve(process.cwd(), DOSSIER);
  if (!fs.existsSync(racine)) {
    console.log(`\nLe dossier "${DOSSIER}" n'existe pas.`);
    console.log(`Crée-le à la racine du projet et dépose tes photos dedans.\n`);
    return;
  }

  const fichiers = fs
    .readdirSync(racine)
    .filter((f) => TYPES[path.extname(f).toLowerCase()])
    .sort();

  if (fichiers.length === 0) {
    console.log(`\nAucune image trouvée dans "${DOSSIER}".`);
    console.log("Formats acceptés : jpg, jpeg, png, webp.\n");
    return;
  }

  // On rassemble toutes les fiches du club
  const [joueurs, staff, bureau] = await Promise.all([
    prisma.player.findMany({ include: { team: { select: { name: true } } } }),
    prisma.staff.findMany({ include: { team: { select: { name: true } } } }),
    prisma.boardMember.findMany(),
  ]);

  const fiches: Fiche[] = [
    ...joueurs.map((p) => ({
      id: p.id, type: "joueur" as const,
      nom: `${p.firstName} ${p.lastName}`.trim(),
      detail: p.team.name,
      cle: cle(`${p.firstName} ${p.lastName}`),
    })),
    ...staff.map((s) => ({
      id: s.id, type: "encadrant" as const,
      nom: `${s.firstName} ${s.lastName}`.trim(),
      detail: s.team ? `${s.role} · ${s.team.name}` : s.role,
      cle: cle(`${s.firstName} ${s.lastName}`),
    })),
    ...bureau.map((b) => ({
      id: b.id, type: "bureau" as const,
      nom: `${b.firstName} ${b.lastName}`.trim(),
      detail: b.role,
      cle: cle(`${b.firstName} ${b.lastName}`),
    })),
  ].filter((f) => f.cle.length > 0);

  console.log(`\n${fichiers.length} image(s) · ${fiches.length} fiche(s) au club`);
  console.log(APPLIQUER ? "Mode : application réelle\n" : "Mode : aperçu (rien ne sera modifié)\n");

  let trouves = 0, ignores = 0, ambigus = 0, erreurs = 0;

  for (const fichier of fichiers) {
    const cleFichier = cle(path.basename(fichier, path.extname(fichier)));

    if (!cleFichier) {
      console.log(`  ✗  ${fichier}  → nom illisible`);
      ignores++;
      continue;
    }

    // 1. Correspondance exacte (ordre des mots indifférent)
    let lot = fiches.filter((f) => f.cle === cleFichier);
    let approx = false;

    // 2. Sinon, on tolère les petites fautes
    if (lot.length === 0) {
      const limite = tolerance(cleFichier.length);
      let meilleur = Infinity;
      const proches: Fiche[] = [];
      for (const f of fiches) {
        const d = distance(f.cle, cleFichier);
        if (d > limite) continue;
        if (d < meilleur) { meilleur = d; proches.length = 0; }
        if (d === meilleur) proches.push(f);
      }
      const noms = new Set(proches.map((p) => p.cle));
      if (noms.size === 1) { lot = proches; approx = true; }
      else if (noms.size > 1) {
        console.log(`  ?  ${fichier}  → plusieurs personnes possibles : ` +
          [...new Set(proches.map((p) => p.nom))].join(", "));
        ambigus++;
        continue;
      }
    }

    if (lot.length === 0) {
      console.log(`  ·  ${fichier}  → aucune correspondance, ignorée`);
      ignores++;
      continue;
    }

    const ou = lot.map((f) => `${f.type} · ${f.detail}`).join(" + ");
    console.log(`  ✓  ${fichier}  → ${lot[0].nom}  (${ou})${approx ? "  ~approché" : ""}`);
    trouves++;

    if (!APPLIQUER) continue;

    try {
      const url = await deposer(path.join(racine, fichier), lot[0].nom);
      for (const f of lot) {
        if (f.type === "joueur") {
          await prisma.player.update({ where: { id: f.id }, data: { photo: url } });
        } else if (f.type === "encadrant") {
          await prisma.staff.update({ where: { id: f.id }, data: { photo: url } });
        } else {
          await prisma.boardMember.update({ where: { id: f.id }, data: { photo: url } });
        }
      }
    } catch (e) {
      console.log(`     ↳ envoi impossible : ${e instanceof Error ? e.message : e}`);
      erreurs++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  reconnues   ${trouves}`);
  console.log(`  ignorées    ${ignores}`);
  if (ambigus > 0) console.log(`  ambiguës    ${ambigus}  (renomme le fichier avec prénom + nom)`);
  if (erreurs > 0) console.log(`  en erreur   ${erreurs}`);
  console.log(`─────────────────────────────────────────`);

  if (!APPLIQUER && trouves > 0) {
    console.log(`\nTout est correct ? Relance avec :  npm run db:photos -- --go\n`);
  } else if (APPLIQUER && trouves > 0) {
    console.log(`\nPhotos mises à jour. Pense à publier : git add . && git commit && git push\n`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
