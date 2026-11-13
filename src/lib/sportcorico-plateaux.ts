import { prisma } from "./prisma";

/** Données sportives uniquement, sans membres ni identifiants personnels. */
export type EquipePlateau = { id: number; nom: string; logo: string | null; usap: boolean; feminine: boolean };
export type RencontrePlateau = { id: number; domicile: number; exterieur: number; butsDomicile: number | null; butsExterieur: number | null; statut: string; tour: string; heure: string | null };
export type Plateau = { id: number; date: string; titre: string; lieu: string | null; categories: string[]; equipes: EquipePlateau[]; rencontres: RencontrePlateau[]; misAJour: string };
export type RapportPlateaux = { actif: boolean; lus: number; modifies: number; erreurs: { id: number; message: string }[] };
const PREFIXE = "sportcorico:plateau:";
const CATEGORIES = new Set(["u6-u7", "u8-u9", "u10-u11", "u12-u13", "pole-feminin-jeune"]);

/** Ex. SPORTCORICO_PLATEAUX=52009:u10-u11+pole-feminin-jeune,52010:u10-u11 */
export function configurationsPlateaux() {
  const brut = process.env.SPORTCORICO_PLATEAUX ?? "";
  const map = new Map<number, string[]>();
  for (const entree of brut.split(/[;,\n]/)) {
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

const int = (v: unknown): number | null => typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
const obj = (v: unknown): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {};
const txt = (v: unknown): string => typeof v === "string" ? v : "";
function safeLogo(v: unknown): string | null {
  const s = txt(v);
  try { const u = new URL(s); return u.protocol === "https:" && u.hostname === "s3.pub2.infomaniak.cloud" ? s : null; } catch { return null; }
}
function lirePlateau(donnees: unknown, id: number, categories: string[]): Plateau {
  const t = obj(obj(donnees).tournament);
  if (int(t.id) !== id) throw new Error("Identifiant du plateau incohérent.");
  const equipes: EquipePlateau[] = (Array.isArray(t.teams) ? t.teams : []).flatMap((item: unknown) => {
    const e = obj(item), eid = int(e.id);
    if (eid === null) return [];
    const nom = txt(e.name).slice(0, 100);
    return [{ id: eid, nom, logo: safeLogo(e.logo), usap: /\bANIZY\s*[- ]?\s*PINON\b/i.test(nom), feminine: /\bF(?:EMININES?)?\b/i.test(nom) }];
  });
  const equipeIds = new Set(equipes.map(e => e.id));
  const rencontres: RencontrePlateau[] = [];
  const phases = Array.isArray(t.phases) ? t.phases : [];
  for (const p0 of phases) {
    const p = obj(p0);
    for (const pool0 of Array.isArray(p.pools) ? p.pools : []) {
      const pool = obj(pool0);
      for (const round0 of Array.isArray(pool.rounds) ? pool.rounds : []) {
        const round = obj(round0);
        for (const m0 of Array.isArray(round.matches) ? round.matches : []) {
          const m = obj(m0), mid = int(m.id), h = int(obj(m.home_team).id), a = int(obj(m.outside_team).id);
          if (mid === null || h === null || a === null || !equipeIds.has(h) || !equipeIds.has(a)) continue;
          rencontres.push({ id: mid, domicile: h, exterieur: a, butsDomicile: int(m.home_score), butsExterieur: int(m.outside_score), statut: txt(m.status).slice(0,40), tour: txt(round.name).slice(0,50), heure: txt(m.planned_time).slice(0,8) || null });
        }
      }
    }
  }
  return { id, date: txt(t.date).slice(0,10), titre: txt(t.name).slice(0,180), lieu: txt(t.location).slice(0,180) || null, categories, equipes, rencontres, misAJour: new Date().toISOString() };
}

/** Synchronise des IDs explicitement configurés; jamais de jeton côté navigateur. */
export async function synchroniserPlateaux(test = false): Promise<RapportPlateaux> {
  const configuration = configurationsPlateaux();
  const token = process.env.SPORTCORICO_API_TOKEN?.trim();
  const rapport: RapportPlateaux = { actif: !!token && configuration.size > 0, lus: 0, modifies: 0, erreurs: [] };
  if (!rapport.actif) return rapport;
  for (const [id, categories] of configuration) {
    try {
      const reponse = await fetch(`https://api.sportcorico.com/api/tournaments/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "x-sportcorico-origin": "DartClient" },
        cache: "no-store", signal: AbortSignal.timeout(10000),
      });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status} (vérifier le jeton et les droits)`);
      const plateau = lirePlateau(await reponse.json(), id, categories);
      rapport.lus++;
      const key = `${PREFIXE}${id}`;
      const ancien = await prisma.appState.findUnique({ where: { key } });
      const precedent = ancien?.value ? JSON.parse(ancien.value) as Plateau : null;
      const memeContenu = precedent && JSON.stringify({ ...precedent, misAJour: "" }) === JSON.stringify({ ...plateau, misAJour: "" });
      if (!memeContenu) {
        rapport.modifies++;
        if (!test) await prisma.appState.upsert({ where: { key }, create: { key, value: JSON.stringify(plateau) }, update: { value: JSON.stringify(plateau) } });
      }
    } catch (e) {
      rapport.erreurs.push({ id, message: e instanceof Error ? e.message : "Erreur inconnue" });
    }
  }
  return rapport;
}

export async function chargerPlateaux(): Promise<Plateau[]> {
  const configuration = configurationsPlateaux();
  if (!configuration.size) return [];
  const valeurs = await prisma.appState.findMany({ where: { key: { in: [...configuration.keys()].map(id => `${PREFIXE}${id}`) } } });
  return valeurs.flatMap(v => {
    if (!v.value) return [];
    try {
      const p = JSON.parse(v.value) as Plateau;
      return configuration.has(p.id) ? [{ ...p, categories: configuration.get(p.id)! }] : [];
    } catch { return []; }
  });
}

export function bilanUsap(p: Plateau, categorie: string) {
  const cibles = p.equipes.filter(e => e.usap && (categorie === "pole-feminin-jeune" ? e.feminine : !e.feminine));
  return cibles.map(equipe => {
    let victoires = 0, nuls = 0, defaites = 0;
    for (const m of p.rencontres) {
      if (m.butsDomicile === null || m.butsExterieur === null) continue;
      if (m.domicile !== equipe.id && m.exterieur !== equipe.id) continue;
      const pour = m.domicile === equipe.id ? m.butsDomicile : m.butsExterieur;
      const contre = m.domicile === equipe.id ? m.butsExterieur : m.butsDomicile;
      if (pour > contre) victoires++; else if (pour === contre) nuls++; else defaites++;
    }
    return { nom: equipe.nom, victoires, nuls, defaites };
  });
}
