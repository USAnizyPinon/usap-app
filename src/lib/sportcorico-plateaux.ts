import { prisma } from "./prisma";

/** Ne conserve que des données sportives ; aucune donnée personnelle de licencié. */
export type EquipePlateau = { id: number; nom: string; logo: string | null; usap: boolean; feminine: boolean };
export type RencontrePlateau = { id: number; domicile: number; exterieur: number; butsDomicile: number | null; butsExterieur: number | null; statut: string; tour: string; heure: string | null };
export type Plateau = { id: number; eventId: number | null; date: string; titre: string; lieu: string | null; categories: string[]; equipes: EquipePlateau[]; rencontres: RencontrePlateau[]; misAJour: string };
export type RapportPlateaux = { actif: boolean; lus: number; modifies: number; erreurs: { id: number; message: string }[] };

const PREFIXE = "sportcorico:plateau:";
const CATEGORIES = new Set(["u6-u7", "u8-u9", "u10-u11", "u12-u13", "pole-feminin-jeune"]);
const ENTIER = (v: unknown): number | null => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const OBJET = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const TEXTE = (v: unknown): string => typeof v === "string" ? v : "";
const LISTE = (v: unknown): unknown[] => Array.isArray(v) ? v : [];

/** Ex. 52009:u10-u11+pole-feminin-jeune,52010:u10-u11 */
export function configurationsPlateaux() {
  const map = new Map<number, string[]>();
  for (const entree of (process.env.SPORTCORICO_PLATEAUX ?? "").split(/[;,\n]/)) {
    if (!entree.trim()) continue;
    const [idBrut, categoriesBrut] = entree.trim().split(":");
    const id = Number(idBrut);
    const categories = (categoriesBrut ?? "").split("+").filter(c => CATEGORIES.has(c));
    if (!Number.isSafeInteger(id) || id <= 0 || !categories.length) continue;
    map.set(id, Array.from(new Set([...(map.get(id) ?? []), ...categories])));
    if (map.size >= 50) break;
  }
  return map;
}

function logoValide(v: unknown): string | null {
  const s = TEXTE(v);
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname === "s3.pub2.infomaniak.cloud" ? s : null;
  } catch { return null; }
}

function analyserPlateau(brut: unknown, id: number, categories: string[]): Plateau {
  const t = OBJET(OBJET(brut).tournament);
  if (ENTIER(t.id) !== id) throw new Error("Identifiant du plateau incohérent.");
  const equipes: EquipePlateau[] = LISTE(t.teams).flatMap(item => {
    const e = OBJET(item);
    const eid = ENTIER(e.id);
    if (eid === null) return [];
    const nom = TEXTE(e.name).slice(0, 100);
    return [{ id: eid, nom, logo: logoValide(e.logo),
      usap: /\bANIZY\s*[- ]?\s*PINON\b/i.test(nom),
      feminine: /\b(F|FEMININES?)\b/i.test(nom) }];
  });
  const ids = new Set(equipes.map(e => e.id));
  const rencontres: RencontrePlateau[] = [];
  const vus = new Set<number>();
  for (const phase0 of LISTE(t.phases)) {
    const phase = OBJET(phase0);
    for (const poule0 of LISTE(phase.pools)) {
      const poule = OBJET(poule0);
      for (const tour0 of LISTE(poule.rounds)) {
        const tour = OBJET(tour0);
        for (const m0 of LISTE(tour.matches)) {
          const m = OBJET(m0);
          const mid = ENTIER(m.id), domicile = ENTIER(OBJET(m.home_team).id), exterieur = ENTIER(OBJET(m.outside_team).id);
          if (mid === null || domicile === null || exterieur === null || !ids.has(domicile) || !ids.has(exterieur) || vus.has(mid)) continue;
          vus.add(mid);
          rencontres.push({ id: mid, domicile, exterieur,
            butsDomicile: ENTIER(m.home_score), butsExterieur: ENTIER(m.outside_score),
            statut: TEXTE(m.status).slice(0, 40), tour: TEXTE(tour.name).slice(0, 50),
            heure: TEXTE(m.planned_time).slice(0, 8) || null });
        }
      }
    }
  }
  return { id, eventId: ENTIER(OBJET(t.event).id), date: TEXTE(t.date).slice(0, 10), titre: TEXTE(t.name).slice(0, 180),
    lieu: TEXTE(t.location).slice(0, 180) || null, categories, equipes, rencontres,
    misAJour: new Date().toISOString() };
}

/** 429/5xx : retente brièvement. 401/403 : ne retente pas, le jeton est invalide. */
async function recupererPlateau(id: number, token: string): Promise<unknown> {
  for (let essai = 0; essai < 3; essai++) {
    let reponse: Response;
    try {
      reponse = await fetch(`https://api.sportcorico.com/api/tournaments/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "x-sportcorico-origin": "DartClient" },
        cache: "no-store", signal: AbortSignal.timeout(9000),
      });
    } catch (e) {
      if (essai === 2) throw e;
      await new Promise(resolve => setTimeout(resolve, 500 * (essai + 1)));
      continue;
    }
    if (reponse.ok) return reponse.json();
    if (reponse.status === 401 || reponse.status === 403) throw new Error(`Accès refusé (HTTP ${reponse.status}) : renouveler les droits SportCorico.`);
    if (![429, 500, 502, 503, 504].includes(reponse.status) || essai === 2) throw new Error(`SportCorico HTTP ${reponse.status}`);
    await new Promise(resolve => setTimeout(resolve, 800 * (essai + 1)));
  }
  throw new Error("Aucune réponse de SportCorico.");
}

/** Ne traite que les identifiants vérifiés/configurés ; aucun balayage d'IDs. */
export async function synchroniserPlateaux(test = false): Promise<RapportPlateaux> {
  const configuration = configurationsPlateaux();
  const token = process.env.SPORTCORICO_API_TOKEN?.trim();
  const rapport: RapportPlateaux = { actif: !!token && configuration.size > 0, lus: 0, modifies: 0, erreurs: [] };
  if (!rapport.actif || !token) return rapport;
  for (const [id, categories] of configuration) {
    try {
      const plateau = analyserPlateau(await recupererPlateau(id, token), id, categories);
      rapport.lus++;
      const cle = `${PREFIXE}${id}`;
      const ancien = await prisma.appState.findUnique({ where: { key: cle } });
      let precedent: Plateau | null = null;
      try { precedent = ancien?.value ? JSON.parse(ancien.value) as Plateau : null; } catch { /* valeur corrompue : remplacer */ }
      const memeContenu = precedent && JSON.stringify({ ...precedent, misAJour: "" }) === JSON.stringify({ ...plateau, misAJour: "" });
      if (!memeContenu) {
        rapport.modifies++;
        if (!test) await prisma.appState.upsert({ where: { key: cle }, create: { key: cle, value: JSON.stringify(plateau) }, update: { value: JSON.stringify(plateau) } });
      }
    } catch (e) {
      // La dernière version valide en base est toujours conservée.
      rapport.erreurs.push({ id, message: e instanceof Error ? e.message : "Erreur de lecture" });
    }
  }
  return rapport;
}

export async function chargerPlateaux(): Promise<Plateau[]> {
  const config = configurationsPlateaux();
  if (!config.size) return [];
  const valeurs = await prisma.appState.findMany({ where: { key: { in: [...config.keys()].map(id => `${PREFIXE}${id}`) } } });
  return valeurs.flatMap(v => {
    if (!v.value) return [];
    try {
      const p = JSON.parse(v.value) as Plateau;
      return config.has(p.id) ? [{ ...p, categories: config.get(p.id)! }] : [];
    } catch { return []; }
  });
}

/** Le bilan V/N/D est calculé depuis les matchs de chaque équipe USAP, pas depuis le classement du plateau. */
export function bilanUsap(p: Plateau, categorie: string) {
  const cibles = p.equipes.filter(e => e.usap && (categorie === "pole-feminin-jeune" ? e.feminine : !e.feminine));
  return cibles.map(equipe => {
    let victoires = 0, nuls = 0, defaites = 0;
    for (const m of p.rencontres) {
      if (m.butsDomicile === null || m.butsExterieur === null || (m.domicile !== equipe.id && m.exterieur !== equipe.id)) continue;
      const pour = m.domicile === equipe.id ? m.butsDomicile : m.butsExterieur;
      const contre = m.domicile === equipe.id ? m.butsExterieur : m.butsDomicile;
      if (pour > contre) victoires++;
      else if (pour === contre) nuls++;
      else defaites++;
    }
    return { nom: equipe.nom, victoires, nuls, defaites };
  });
}
