import type { Match, Team } from "@prisma/client";
import { prisma } from "./prisma";
import { lireEquipe, type MatchLu } from "./sportcorico";
import { destinatairesResultat, envoyerNotification } from "./push";

/**
 * Reprise du calendrier et des resultats publies par SportCorico.
 *
 * Le rapprochement se fait d'abord sur l'identifiant SportCorico du match,
 * puis, pour les matchs deja saisis avant cette synchronisation, sur le jour.
 * Un match absent de l'application est cree ; un match reporte voit sa date
 * corrigee ; un score saisi a la main n'est jamais ecrase.
 */

/** Au-dela, le resultat n'est plus une nouvelle : on ecrit sans notifier. */
const FRAICHEUR_HEURES = 48;
/** Filet de securite : jamais plus de notifications que cela en un passage. */
const NOTIFS_MAX = 4;

/** Cle du dernier passage, gardee en base pour limiter la frequence. */
const CLE_PASSAGE = "sportcorico:dernier";

/** Vrai si une relecture a eu lieu il y a moins de `minutes`. */
export async function passageRecent(minutes: number) {
  try {
    const etat = await prisma.appState.findUnique({ where: { key: CLE_PASSAGE } });
    if (!etat) return false;
    return Date.now() - etat.updatedAt.getTime() < minutes * 60_000;
  } catch {
    // Table absente ou base injoignable : on laisse passer plutot que bloquer.
    return false;
  }
}

/** Enregistre l'heure de la relecture en cours. */
export async function noterPassage() {
  try {
    await prisma.appState.upsert({
      where: { key: CLE_PASSAGE },
      create: { key: CLE_PASSAGE, value: "ok" },
      update: { value: "ok" },
    });
  } catch {
    // Sans incidence : au pire la relecture sera declenchee une fois de trop.
  }
}

/** Heure du dernier passage, pour l'afficher dans l'administration. */
export async function dernierPassage() {
  try {
    const etat = await prisma.appState.findUnique({ where: { key: CLE_PASSAGE } });
    return etat?.updatedAt ?? null;
  } catch {
    return null;
  }
}

const JOUR_PARIS = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const QUAND_PARIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  dateStyle: "short",
  timeStyle: "short",
});
const HEURE_PARIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

/** « 2026-11-08 » pour une date donnee, vue depuis la France. */
export function jourParis(d: Date) {
  return JOUR_PARIS.format(d);
}

export type LigneRapport = {
  equipe: string;
  quand: string;
  adversaire: string;
  score: string;
  /**
   * cree       : le match n'existait pas, il a ete ajoute
   * maj        : quelque chose a change (score, horaire, adversaire…)
   * identique  : rien a faire
   * verrouille : score saisi a la main, laisse tel quel
   */
  etat: "cree" | "maj" | "identique" | "verrouille";
  changements: string[];
  notifie?: number;
};

export type Rapport = {
  test: boolean;
  equipes: {
    nom: string;
    url: string;
    equipeSportCorico?: string;
    erreur?: string;
    matchsLus: number;
    joues: number;
  }[];
  lignes: LigneRapport[];
  crees: number;
  modifies: number;
  notifications: number;
};

/**
 * Relit toutes les equipes qui ont une page SportCorico.
 * En mode test, rien n'est enregistre ni envoye.
 */
export async function synchroniser({ test = false } = {}): Promise<Rapport> {
  const equipes = await prisma.team.findMany({
    where: { sportcoricoUrl: { not: null } },
    orderBy: { order: "asc" },
  });

  const rapport: Rapport = {
    test,
    equipes: [],
    lignes: [],
    crees: 0,
    modifies: 0,
    notifications: 0,
  };

  for (const equipe of equipes) {
    const lecture = await lireEquipe(equipe.sportcoricoUrl!);

    rapport.equipes.push({
      nom: equipe.name,
      url: lecture.url,
      equipeSportCorico: lecture.equipe,
      erreur: lecture.erreur,
      matchsLus: lecture.matchs.length,
      joues: lecture.joues,
    });

    if (lecture.erreur || lecture.matchs.length === 0) continue;

    const notres = await prisma.match.findMany({ where: { teamId: equipe.id } });
    const parId = new Map<string, Match>();
    const parJour = new Map<string, Match>();
    for (const m of notres) {
      if (m.sportcoricoId) parId.set(m.sportcoricoId, m);
      parJour.set(jourParis(m.kickoff), m);
    }

    for (const lu of lecture.matchs) {
      // L'identifiant prime : il survit a un report de date.
      const notre = (lu.idExterne && parId.get(lu.idExterne)) || parJour.get(jourParis(lu.debut));

      const ligne = await traiter({
        equipe,
        lu,
        notre,
        test,
        peutNotifier: rapport.notifications < NOTIFS_MAX,
      });

      rapport.lignes.push(ligne);
      if (ligne.etat === "cree") rapport.crees++;
      if (ligne.etat === "maj") rapport.modifies++;
      rapport.notifications += ligne.notifie ?? 0;
    }
  }

  // Les plus recents d'abord : c'est ce qu'on relit en priorite.
  rapport.lignes.sort((a, b) => b.quand.localeCompare(a.quand));
  return rapport;
}

async function traiter(args: {
  equipe: Team;
  lu: MatchLu;
  notre?: Match;
  test: boolean;
  peutNotifier: boolean;
}): Promise<LigneRapport> {
  const { equipe, lu, notre, test, peutNotifier } = args;

  const base = {
    equipe: equipe.name,
    quand: QUAND_PARIS.format(lu.debut),
    adversaire: `${lu.domicile ? "" : "chez "}${lu.adversaire}`,
    score:
      lu.scoreUsap === null
        ? "à venir"
        : `${lu.scoreUsap} – ${lu.scoreAdverse}${
            lu.tabUsap !== null ? ` (tab ${lu.tabUsap}–${lu.tabAdverse})` : ""
          }`,
  };

  // --- Match absent de l'application : on l'ajoute ---------------------
  if (!notre) {
    if (!test) {
      await prisma.match.create({
        data: {
          teamId: equipe.id,
          sportcoricoId: lu.idExterne || null,
          kickoff: lu.debut,
          opponent: lu.adversaire,
          opponentLogo: lu.adversaireLogo,
          home: lu.domicile,
          competition: lu.competition,
          venue: lu.domicile ? equipe.venue : null,
          scoreFor: lu.scoreUsap,
          scoreAgainst: lu.scoreAdverse,
          syncedAt: new Date(),
        },
      });
    }
    return { ...base, etat: "cree", changements: ["ajouté au calendrier"] };
  }

  // --- Match connu : on met a jour ce qui a bouge ------------------------
  const data: Partial<
    Pick<
      Match,
      | "sportcoricoId"
      | "kickoff"
      | "home"
      | "competition"
      | "opponentLogo"
      | "scoreFor"
      | "scoreAgainst"
      | "syncedAt"
    >
  > = {};
  const changements: string[] = [];

  if (lu.idExterne && notre.sportcoricoId !== lu.idExterne) {
    data.sportcoricoId = lu.idExterne;
  }

  // Report ou changement d'horaire : une minute d'ecart suffit a trancher.
  if (Math.abs(notre.kickoff.getTime() - lu.debut.getTime()) > 60_000) {
    data.kickoff = lu.debut;
    changements.push(
      jourParis(notre.kickoff) === jourParis(lu.debut)
        ? `horaire ${HEURE_PARIS.format(notre.kickoff)} → ${HEURE_PARIS.format(lu.debut)}`
        : `reporté au ${QUAND_PARIS.format(lu.debut)}`
    );
  }

  if (notre.home !== lu.domicile) {
    data.home = lu.domicile;
    changements.push(lu.domicile ? "passe à domicile" : "passe à l'extérieur");
  }

  if (notre.competition !== lu.competition) {
    data.competition = lu.competition;
    changements.push(`compétition : ${lu.competition.toLowerCase()}`);
  }

  // Le logo n'est jamais retire, seulement complete ou corrige.
  if (lu.adversaireLogo && notre.opponentLogo !== lu.adversaireLogo) {
    data.opponentLogo = lu.adversaireLogo;
    if (!notre.opponentLogo) changements.push("logo de l'adversaire");
  }

  // --- Le score, avec son garde-fou -------------------------------------
  const scoreDifferent =
    lu.scoreUsap !== null &&
    (notre.scoreFor !== lu.scoreUsap || notre.scoreAgainst !== lu.scoreAdverse);

  let notifie = 0;

  if (scoreDifferent && notre.scoreLocked) {
    if (!test && Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: notre.id }, data });
    }
    return { ...base, etat: "verrouille", changements };
  }

  if (scoreDifferent) {
    data.scoreFor = lu.scoreUsap;
    data.scoreAgainst = lu.scoreAdverse;
    data.syncedAt = new Date();
    changements.push(`score ${lu.scoreUsap} – ${lu.scoreAdverse}`);
  }

  if (Object.keys(data).length === 0) {
    return { ...base, etat: "identique", changements: [] };
  }

  if (!test) {
    await prisma.match.update({ where: { id: notre.id }, data });

    // Une notification n'a de sens que pour un resultat qu'on apprend et qui
    // vient de tomber : une reprise de saison entiere ne reveille personne.
    const nouveau = notre.scoreFor === null || notre.scoreAgainst === null;
    const ageHeures = (Date.now() - lu.debut.getTime()) / 3_600_000;

    if (scoreDifferent && nouveau && peutNotifier && ageHeures >= 0 && ageHeures <= FRAICHEUR_HEURES) {
      notifie = await prevenir(equipe, lu);
    }
  }

  return { ...base, etat: "maj", changements, notifie };
}

async function prevenir(equipe: Team, lu: MatchLu) {
  const verdict =
    lu.scoreUsap! > lu.scoreAdverse!
      ? "Victoire"
      : lu.scoreUsap! < lu.scoreAdverse!
        ? "Défaite"
        : "Match nul";

  const cibles = await destinatairesResultat(equipe.id);
  const { envoyees } = await envoyerNotification(cibles, {
    title: `${equipe.name} · ${verdict}`,
    body: lu.domicile
      ? `USAP ${lu.scoreUsap} – ${lu.scoreAdverse} ${lu.adversaire}`
      : `${lu.adversaire} ${lu.scoreAdverse} – ${lu.scoreUsap} USAP`,
    url: "/matchs",
  });
  return envoyees;
}
