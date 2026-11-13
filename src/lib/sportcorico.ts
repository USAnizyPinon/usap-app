/**
 * Lecture du calendrier et des resultats depuis SportCorico.
 *
 * SportCorico publie une page par equipe, en acces libre :
 *   https://www.sportcorico.com/clubs/us-anizy-pinon/anizy-pinon-us
 *
 * Cette page est construite avec Nuxt, qui depose dans le HTML un bloc
 * <script id="__NUXT_DATA__"> contenant toutes les donnees qui servent a
 * l'affichage : noms de clubs propres, horaires, competitions, scores et
 * logos des deux equipes. On lit ce bloc plutot que le texte affiche.
 * C'est ce que la page elle-meme utilise pour se dessiner, donc cela ne
 * bouge pas quand le graphisme change.
 *
 * Le bloc est encode au format « devalue » : un tableau plat ou chaque
 * nombre est l'indice d'une autre case. resoudreDevalue() le remet a plat.
 */

import type { Competition } from "@prisma/client";

/** Un match lu sur SportCorico, champs utiles uniquement. */
export type MatchLu = {
  /** Identifiant SportCorico du match : stable, meme si la date change. */
  idExterne: string;
  /** Coup d'envoi annonce. */
  debut: Date;
  /** Vrai si l'USAP recoit. */
  domicile: boolean;
  /** Nom du club adverse, tel que SportCorico l'ecrit. */
  adversaire: string;
  /** Logo du club adverse, ou null. */
  adversaireLogo: string | null;
  /** Scores : null tant que le match n'est pas joue. */
  scoreUsap: number | null;
  scoreAdverse: number | null;
  /** Tirs au but, pour les coupes. */
  tabUsap: number | null;
  tabAdverse: number | null;
  /** Forfait declare d'un cote ou de l'autre. */
  forfait: boolean;
  /** Competition, ramenee aux categories de l'application. */
  competition: Competition;
  /** Nom complet de la competition, tel qu'affiche. */
  competitionNom: string;
};

export type LectureSportCorico = {
  url: string;
  /** Nom de l'equipe chez SportCorico, par exemple « SENIORS 1 ». */
  equipe?: string;
  matchs: MatchLu[];
  /** Nombre de matchs joues parmi eux. */
  joues: number;
  erreur?: string;
};

/** Enveloppes d'hydratation que Nuxt ajoute autour de certaines valeurs. */
const ENVELOPPES = new Set(["ShallowReactive", "Reactive", "Ref", "ShallowRef", "EmptyRef"]);

/**
 * Remet a plat le tableau « devalue » depose par Nuxt.
 * Chaque nombre rencontre est l'indice d'une autre case du tableau.
 */
export function resoudreDevalue(brut: unknown[]): unknown {
  const fait = new Map<number, unknown>();

  function lire(i: unknown): unknown {
    if (typeof i !== "number" || !Number.isInteger(i) || i < 0 || i >= brut.length) {
      // Les indices hors tableau servent a coder null / undefined.
      return null;
    }
    if (fait.has(i)) return fait.get(i);

    const v = brut[i];
    if (v === null || typeof v !== "object") return v;

    if (Array.isArray(v)) {
      if (typeof v[0] === "string" && ENVELOPPES.has(v[0])) return lire(v[1]);
      const sortie: unknown[] = [];
      // Enregistre avant de remplir : certaines donnees se referencent entre elles.
      fait.set(i, sortie);
      for (const j of v) sortie.push(lire(j));
      return sortie;
    }

    const sortie: Record<string, unknown> = {};
    fait.set(i, sortie);
    for (const [cle, j] of Object.entries(v as Record<string, unknown>)) {
      sortie[cle] = lire(j);
    }
    return sortie;
  }

  return lire(0);
}

/** Forme d'un match telle que SportCorico la publie. */
type GameBrut = {
  id?: unknown;
  home_club_slug?: unknown;
  home_club_name?: unknown;
  home_team_short_name?: unknown;
  home_logo?: unknown;
  home_score?: unknown;
  home_tabs_score?: unknown;
  home_forfeit?: unknown;
  outside_club_slug?: unknown;
  outside_club_name?: unknown;
  outside_team_short_name?: unknown;
  outside_logo?: unknown;
  outside_score?: unknown;
  outside_tabs_score?: unknown;
  outside_forfeit?: unknown;
  event_date?: unknown;
  begin_date_timestamp?: unknown;
  championship_name?: unknown;
  exempt?: unknown;
};

function estGame(x: unknown): x is GameBrut {
  return (
    typeof x === "object" &&
    x !== null &&
    "home_club_slug" in x &&
    "outside_club_slug" in x &&
    "begin_date_timestamp" in x
  );
}

/** Cherche la liste des matchs n'importe ou dans les donnees resolues. */
export function trouverGames(racine: unknown): GameBrut[] {
  const vus = new Set<unknown>();
  const pile: unknown[] = [racine];

  while (pile.length > 0) {
    const noeud = pile.pop();
    if (typeof noeud !== "object" || noeud === null) continue;
    if (vus.has(noeud)) continue;
    vus.add(noeud);

    if (Array.isArray(noeud)) {
      if (noeud.length > 0 && noeud.every(estGame)) return noeud;
      pile.push(...noeud);
      continue;
    }
    pile.push(...Object.values(noeud as Record<string, unknown>));
  }

  return [];
}

/** Ramene le nom d'une competition aux quatre categories de l'application. */
export function classerCompetition(nom: string): Competition {
  const n = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  if (n.includes("COUPE") || n.includes("CHALLENGE") || n.includes("TROPHEE")) return "COUPE";
  if (n.includes("AMICAL")) return "AMICAL";
  if (n.includes("PLATEAU")) return "PLATEAU";
  return "CHAMPIONNAT";
}

function texte(x: unknown): string | null {
  return typeof x === "string" && x.trim() !== "" ? x.trim() : null;
}

function entier(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

/** Le slug du club, lu dans l'adresse : .../clubs/us-anizy-pinon/anizy-pinon-us */
export function slugDuClub(url: string): string | null {
  const m = /\/clubs\/([^/?#]+)/.exec(url);
  return m ? m[1] : null;
}

/** Le slug de l'equipe, dernier element de l'adresse. */
export function slugDeLEquipe(url: string): string | null {
  const m = /\/clubs\/[^/?#]+\/([^/?#]+)/.exec(url);
  return m ? m[1] : null;
}

/** Extrait le bloc __NUXT_DATA__ d'une page SportCorico. */
export function extraireNuxt(html: string): unknown[] | null {
  const debut = /<script[^>]*id="__NUXT_DATA__"[^>]*>/i.exec(html);
  if (!debut) return null;
  const depuis = debut.index + debut[0].length;
  const fin = html.indexOf("</script>", depuis);
  if (fin === -1) return null;
  try {
    const donnees = JSON.parse(html.slice(depuis, fin));
    return Array.isArray(donnees) ? donnees : null;
  } catch {
    return null;
  }
}

/**
 * Transforme les donnees brutes d'une page en matchs exploitables.
 * Exporte a part pour pouvoir etre verifie sans appel reseau.
 */
export function lireHtml(html: string, url: string): LectureSportCorico {
  const vide: LectureSportCorico = { url, matchs: [], joues: 0 };

  const club = slugDuClub(url);
  if (!club) return { ...vide, erreur: "Adresse SportCorico non reconnue." };

  const brut = extraireNuxt(html);
  if (!brut) {
    return { ...vide, erreur: "Données introuvables sur la page (SportCorico a peut-être changé)." };
  }

  const racine = resoudreDevalue(brut);
  const games = trouverGames(racine);
  if (games.length === 0) return { ...vide, erreur: "Aucun match trouvé sur cette page." };

  const matchs: MatchLu[] = [];

  for (const g of games) {
    // Les exemptions ne sont pas des matchs.
    if (g.exempt === true) continue;

    const horodatage = entier(g.begin_date_timestamp);
    const debut = horodatage !== null ? new Date(horodatage * 1000) : dateDeTexte(g.event_date);
    if (!debut) continue;

    const domicile = g.home_club_slug === club;
    const exterieur = g.outside_club_slug === club;
    // Ni d'un cote ni de l'autre : ce match ne concerne pas le club.
    if (domicile === exterieur) continue;

    matchs.push({
      idExterne: String(entier(g.id) ?? texte(g.id) ?? ""),
      debut,
      domicile,
      adversaire: domicile
        ? nomAdversaire(g.outside_team_short_name, g.outside_club_name)
        : nomAdversaire(g.home_team_short_name, g.home_club_name),
      adversaireLogo: texte(domicile ? g.outside_logo : g.home_logo),
      scoreUsap: entier(domicile ? g.home_score : g.outside_score),
      scoreAdverse: entier(domicile ? g.outside_score : g.home_score),
      tabUsap: entier(domicile ? g.home_tabs_score : g.outside_tabs_score),
      tabAdverse: entier(domicile ? g.outside_tabs_score : g.home_tabs_score),
      forfait: g.home_forfeit === true || g.outside_forfeit === true,
      competition: classerCompetition(texte(g.championship_name) ?? ""),
      competitionNom: texte(g.championship_name) ?? "",
    });
  }

  // Du plus ancien au plus recent.
  matchs.sort((a, b) => a.debut.getTime() - b.debut.getTime());

  return {
    url,
    equipe: nomEquipe(racine, slugDeLEquipe(url)) ?? undefined,
    matchs,
    joues: matchs.filter((m) => m.scoreUsap !== null && m.scoreAdverse !== null).length,
  };
}

/** « 2026-08-23 15:00 » en heure française. */
function dateDeTexte(x: unknown): Date | null {
  const s = texte(x);
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  // L'ecart de la France a l'heure universelle vaut 1 h en hiver, 2 h en ete.
  const brut = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const decalage = ecartParis(new Date(brut));
  return new Date(brut - decalage);
}

function ecartParis(d: Date) {
  const paris = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return paris.getTime() - utc.getTime();
}

/**
 * Nom de l'equipe chez SportCorico, par exemple « SENIORS 1 ».
 * La page decrit aussi les autres equipes du club : on retient celle dont le
 * slug correspond a l'adresse demandee, pas la premiere rencontree.
 */
function nomEquipe(racine: unknown, slugEquipe: string | null): string | null {
  if (!slugEquipe) return null;
  const vus = new Set<unknown>();
  const pile: unknown[] = [racine];
  while (pile.length > 0) {
    const n = pile.pop();
    if (typeof n !== "object" || n === null || vus.has(n)) continue;
    vus.add(n);
    if (!Array.isArray(n)) {
      const o = n as Record<string, unknown>;
      if (o.slug === slugEquipe && typeof o.name_generated === "string") {
        return o.name_generated;
      }
      pile.push(...Object.values(o));
    } else {
      pile.push(...n);
    }
  }
  return null;
}

/**
 * Nom de l'equipe adverse. On garde le nom court, qui porte le numero
 * d'equipe (« Bucy le Long FC 2 ») : un dirigeant doit voir s'il affronte
 * l'equipe premiere ou la reserve. Le « 1 » d'une equipe premiere est retire,
 * personne ne l'ecrit.
 */
function nomAdversaire(court: unknown, club: unknown): string {
  const nom = texte(court);
  if (nom) return nom.replace(/\s+1$/, "");
  return texte(club) ?? "Adversaire inconnu";
}

/** Telecharge une page SportCorico et en extrait les matchs. */
export async function lireEquipe(url: string): Promise<LectureSportCorico> {
  const vide: LectureSportCorico = { url, matchs: [], joues: 0 };

  if (!/^https:\/\/(www\.)?sportcorico\.com\/clubs\//i.test(url)) {
    return { ...vide, erreur: "L'adresse doit ressembler à https://www.sportcorico.com/clubs/…" };
  }

  try {
    const reponse = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "USAP-App/1.0 (+https://app.usanizypinon.fr)",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      // Au-dela, le cron Vercel serait coupe avant la reponse.
      signal: AbortSignal.timeout(15000),
    });
    if (!reponse.ok) return { ...vide, erreur: `SportCorico a répondu ${reponse.status}.` };
    return lireHtml(await reponse.text(), url);
  } catch (e) {
    const cause = e instanceof Error ? e.message : "cause inconnue";
    return { ...vide, erreur: `Page injoignable (${cause}).` };
  }
}
