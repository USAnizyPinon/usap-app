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
  for (const nom of [".env", ".env.local"]) {
    const f = path.resolve(process.cwd(), nom);
    if (!fs.existsSync(f)) continue;
    for (const ligne of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
      if (/^\s*#/.test(ligne)) continue;
      const m = ligne.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const valeur = m[2].replace(/^["']|["']$/g, "").trim();
      if (valeur && !process.env[m[1]]) process.env[m[1]] = valeur;
    }
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

/**
 * Nombre de corrections pour passer de a à b.
 * Compte l'inversion de deux lettres voisines pour une seule faute :
 * « Mlero » et « Melro » ne sont donc qu'à une correction.
 */
function distance(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0 || n === 0) return Math.max(m, n);
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cout);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/** Deux mots sont considérés identiques à une petite faute près. */
function memeMot(a: string, b: string) {
  if (a === b) return true;
  const l = Math.min(a.length, b.length);
  return l >= 4 && distance(a, b) <= 1;
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

let _client: ReturnType<typeof createClient> | null = null;

/** Vérifie la configuration et explique clairement ce qui manque. */
function verifierConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  const soucis: string[] = [];

  if (!url) soucis.push("NEXT_PUBLIC_SUPABASE_URL est absente du fichier .env");
  else if (!/^https?:\/\//.test(url))
    soucis.push(`NEXT_PUBLIC_SUPABASE_URL doit commencer par https:// (valeur lue : "${url}")`);
  if (!key) soucis.push("SUPABASE_SECRET_KEY est absente du fichier .env");

  if (soucis.length > 0) {
    console.log("\nConfiguration incomplète :\n");
    for (const s of soucis) console.log("   • " + s);
    console.log(`
Ajoutez ces deux lignes dans le fichier .env, à la racine du projet :

  NEXT_PUBLIC_SUPABASE_URL="https://movqisiftiltsawwdnrc.supabase.co"
  SUPABASE_SECRET_KEY="sb_secret_..."

L'adresse se trouve dans Supabase > Settings > General > Project URL,
la clé dans Supabase > Settings > API Keys > Secret key.
`);
    return false;
  }
  return true;
}

function supabase() {
  if (!_client) {
    _client = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL as string).trim(),
      (process.env.SUPABASE_SECRET_KEY as string).trim(),
      { auth: { persistSession: false } }
    );
  }
  return _client;
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
  mots: string[];
};

async function main() {
  const racine = path.resolve(process.cwd(), DOSSIER);
  if (!fs.existsSync(racine)) {
    console.log(`\nLe dossier "${DOSSIER}" n'existe pas.`);
    console.log(`Crée-le à la racine du projet et dépose tes photos dedans.\n`);
    return;
  }

  if (APPLIQUER && !verifierConfig()) return;

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
      cle: cle(`${p.firstName} ${p.lastName}`), mots: motsUtiles(`${p.firstName} ${p.lastName}`),
    })),
    ...staff.map((s) => ({
      id: s.id, type: "encadrant" as const,
      nom: `${s.firstName} ${s.lastName}`.trim(),
      detail: s.team ? `${s.role} · ${s.team.name}` : s.role,
      cle: cle(`${s.firstName} ${s.lastName}`), mots: motsUtiles(`${s.firstName} ${s.lastName}`),
    })),
    ...bureau.map((b) => ({
      id: b.id, type: "bureau" as const,
      nom: `${b.firstName} ${b.lastName}`.trim(),
      detail: b.role,
      cle: cle(`${b.firstName} ${b.lastName}`), mots: motsUtiles(`${b.firstName} ${b.lastName}`),
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

    const motsFichier = motsUtiles(path.basename(fichier, path.extname(fichier)));

    /** Retient un groupe de fiches si elles désignent une seule personne. */
    const retenir = (proches: Fiche[]): Fiche[] | "ambigu" | null => {
      if (proches.length === 0) return null;
      const noms = new Set(proches.map((p) => p.cle));
      return noms.size === 1 ? proches : "ambigu";
    };

    // 1. Correspondance exacte, l'ordre des mots n'ayant pas d'importance
    let lot = fiches.filter((f) => f.cle === cleFichier);
    let approx = false;
    let candidats: Fiche[] | "ambigu" | null = null;

    // 2. Le fichier ne donne qu'une partie du nom : « Kylian Saint Leger »
    //    pour « Kylian Gadiffet Saint Leger »
    if (lot.length === 0 && motsFichier.length >= 2) {
      const proches = fiches.filter((f) =>
        motsFichier.every((m) => f.mots.some((fm) => memeMot(fm, m)))
      );
      candidats = retenir(proches);
      if (candidats === "ambigu") {
        console.log(`  ?  ${fichier}  → plusieurs personnes possibles : ` +
          [...new Set(proches.map((p) => p.nom))].join(", "));
        ambigus++; continue;
      }
      if (candidats) { lot = candidats; approx = true; }
    }

    // 3. Petites fautes de frappe sur l'ensemble du nom
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
      candidats = retenir(proches);
      if (candidats === "ambigu") {
        console.log(`  ?  ${fichier}  → plusieurs personnes possibles : ` +
          [...new Set(proches.map((p) => p.nom))].join(", "));
        ambigus++; continue;
      }
      if (candidats) { lot = candidats; approx = true; }
    }

    // 4. Un seul mot dans le fichier : on l'accepte s'il ne désigne qu'une personne
    if (lot.length === 0 && motsFichier.length === 1 && motsFichier[0].length >= 4) {
      const proches = fiches.filter((f) => f.mots.some((fm) => memeMot(fm, motsFichier[0])));
      candidats = retenir(proches);
      if (candidats === "ambigu") {
        console.log(`  ?  ${fichier}  → prénom seul, plusieurs personnes : ` +
          [...new Set(proches.map((p) => p.nom))].join(", "));
        ambigus++; continue;
      }
      if (candidats) { lot = candidats; approx = true; }
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
