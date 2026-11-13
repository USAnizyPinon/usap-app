/**
 * Lecture des scores depuis SportCorico.
 *
 * SportCorico publie une page par equipe, en acces libre, qui contient le
 * calendrier et les resultats :
 *   https://www.sportcorico.com/clubs/us-anizy-pinon/anizy-pinon-us
 *
 * Il n'existe pas d'API. On lit donc la page telle qu'elle est publiee.
 * Pour que cela resiste aux changements de mise en page, on ne s'appuie sur
 * aucune balise ni aucune classe CSS : on retire tout le HTML et on travaille
 * sur le texte. Seuls deux reperes sont utilises, et ils ne bougent pas :
 * une date au format JJ/MM/AAAA, et un score du type "2-0" juste apres.
 *
 * Le nom de l'adversaire n'est volontairement pas utilise pour le
 * rapprochement : nos matchs sont deja en base avec leur date, il suffit de
 * retrouver le bon jour. On s'en sert seulement pour le diagnostic.
 */

/** Un match lu sur la page SportCorico. */
export type MatchLu = {
  /** Jour du match, a minuit, heure locale. */
  jour: Date;
  /** Score de l'USAP, puis celui de l'adversaire. */
  scoreUsap: number;
  scoreAdverse: number;
  /** Vrai si l'USAP recevait. */
  domicile: boolean;
  /** Nom de l'adversaire tel qu'il apparait, a titre indicatif. */
  adversaire: string;
  /** Extrait de la page, pour verifier ce qui a ete compris. */
  extrait: string;
};

export type LectureSportCorico = {
  url: string;
  /** Matchs joues, avec leur score. */
  matchs: MatchLu[];
  /** Nombre de dates reperees sur la page, score ou non. */
  datesVues: number;
  /** Message d'erreur si la page n'a pas pu etre lue. */
  erreur?: string;
  /** Debut du texte extrait, pour comprendre en cas de souci. */
  apercu: string;
};

/** Retire les accents, la ponctuation et les majuscules. */
export function simplifier(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const ENTITES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&eacute;": "é",
  "&egrave;": "è",
  "&agrave;": "à",
  "&ccedil;": "ç",
  "&ocirc;": "ô",
  "&ecirc;": "ê",
};

/** Transforme une page HTML en une seule ligne de texte lisible. */
export function htmlEnTexte(html: string) {
  return html
    // Le contenu des scripts et des styles n'est pas du texte affiche.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Chaque balise devient une espace : deux mots colles seraient illisibles.
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, (e) => ENTITES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mot qui identifie nos equipes sur SportCorico : elles y apparaissent sous
 * "Anizy Pinon US 1", "Anizy Pinon Us Seniors 2"... Un seul mot suffit, et il
 * resiste aux variantes de numerotation.
 */
const CLUB = simplifier(process.env.SPORTCORICO_CLUB || "anizy");

// Une date de match : 08/11/2026
const DATE = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
// Un score : 2-0, 2 - 0, 2–0. Les tirs au but suivent et sont ignores.
const SCORE = /^[^\d]{0,12}(\d{1,2})\s*[-–]\s*(\d{1,2})\b/;

/**
 * Extrait les matchs joues d'une page SportCorico.
 * Exporte separement pour pouvoir etre verifie sans appel reseau.
 */
export function lireTexte(texte: string): { matchs: MatchLu[]; datesVues: number } {
  const matchs: MatchLu[] = [];

  // Toutes les dates de la page, dans l'ordre d'apparition.
  const reperes: { index: number; fin: number; jour: Date }[] = [];
  DATE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DATE.exec(texte)) !== null) {
    const [brut, jj, mm, aaaa] = m;
    const jour = new Date(Number(aaaa), Number(mm) - 1, Number(jj));
    // Une date inventee par une coquille ne doit pas passer.
    if (
      jour.getDate() === Number(jj) &&
      jour.getMonth() === Number(mm) - 1 &&
      jour.getFullYear() === Number(aaaa)
    ) {
      reperes.push({ index: m.index, fin: m.index + brut.length, jour });
    }
  }

  for (let i = 0; i < reperes.length; i++) {
    const repere = reperes[i];
    const suivant = reperes[i + 1];
    const precedent = reperes[i - 1];

    // Ce qui suit la date, jusqu'au match suivant.
    const apres = texte.slice(repere.fin, Math.min(suivant?.index ?? texte.length, repere.fin + 400));
    const score = SCORE.exec(apres);
    // Pas de score juste apres la date : le match n'est pas encore joue.
    if (!score) continue;

    const butsGauche = Number(score[1]);
    const butsDroite = Number(score[2]);
    // Un score de football reste raisonnable : au-dela, on a lu autre chose.
    if (butsGauche > 30 || butsDroite > 30) continue;

    // L'equipe qui recoit est nommee avant la date, celle qui se deplace apres
    // le score.
    const debutAvant = Math.max(precedent?.fin ?? 0, repere.index - 160);
    const avant = texte.slice(debutAvant, repere.index);
    const apresScore = apres.slice(score[0].length, score[0].length + 160);

    // Le nom du club peut aussi apparaitre dans le match voisin. On retient
    // donc l'occurrence la plus proche du score, pas la simple presence.
    const avantSimple = simplifier(avant);
    const apresSimple = simplifier(apresScore);
    const posAvant = avantSimple.lastIndexOf(CLUB);
    const posApres = apresSimple.indexOf(CLUB);
    const distAvant = posAvant === -1 ? Infinity : avantSimple.length - posAvant;
    const distApres = posApres === -1 ? Infinity : posApres;

    // Le club n'apparait d'aucun cote : ce n'est pas un match de l'USAP.
    if (distAvant === Infinity && distApres === Infinity) continue;

    const usapRecoit = distAvant <= distApres;
    // L'adversaire se lit au debut du fragment qui suit le score quand l'USAP
    // recoit, et a la fin de celui qui precede la date quand elle se deplace.
    const adversaire = usapRecoit ? nettoyerNom(apresScore, "debut") : nettoyerNom(avant, "fin");

    matchs.push({
      jour: repere.jour,
      scoreUsap: usapRecoit ? butsGauche : butsDroite,
      scoreAdverse: usapRecoit ? butsDroite : butsGauche,
      domicile: usapRecoit,
      adversaire,
      extrait: `${avant.trim()} | ${texte.slice(repere.index, repere.fin)} | ${apres
        .slice(0, 80)
        .trim()}`.slice(-220),
    });
  }

  return { matchs, datesVues: reperes.length };
}

/**
 * Garde les quelques mots qui forment le nom du club adverse.
 * Ce nom ne sert qu'a relire ce qui a ete compris : le rapprochement avec nos
 * matchs se fait sur la date, jamais sur ce texte.
 */
function nettoyerNom(fragment: string, cote: "debut" | "fin") {
  const mots = fragment
    .replace(/\d+/g, " ")
    .split(/\s+/)
    .filter((mot) => mot.length > 1);
  const retenus = cote === "debut" ? mots.slice(0, 4) : mots.slice(-4);
  return retenus.join(" ").trim();
}

/** Telecharge une page SportCorico et en extrait les matchs joues. */
export async function lireEquipe(url: string): Promise<LectureSportCorico> {
  const vide: LectureSportCorico = { url, matchs: [], datesVues: 0, apercu: "" };

  if (!/^https:\/\/(www\.)?sportcorico\.com\//i.test(url)) {
    return { ...vide, erreur: "L'adresse doit commencer par https://www.sportcorico.com/" };
  }

  let html: string;
  try {
    const reponse = await fetch(url, {
      cache: "no-store",
      headers: {
        // Sans en-tete d'identification, certaines pages repondent en erreur.
        "User-Agent": "USAP-App/1.0 (+https://app.usanizypinon.fr)",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      // Au-dela, le cron Vercel serait coupe avant la reponse.
      signal: AbortSignal.timeout(15000),
    });
    if (!reponse.ok) {
      return { ...vide, erreur: `SportCorico a répondu ${reponse.status}.` };
    }
    html = await reponse.text();
  } catch (e) {
    const cause = e instanceof Error ? e.message : "cause inconnue";
    return { ...vide, erreur: `Page injoignable (${cause}).` };
  }

  const texte = htmlEnTexte(html);
  const { matchs, datesVues } = lireTexte(texte);

  return { url, matchs, datesVues, apercu: texte.slice(0, 1200) };
}
