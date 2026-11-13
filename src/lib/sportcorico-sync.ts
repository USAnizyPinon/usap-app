import type { Match } from "@prisma/client";
import { prisma } from "./prisma";
import { lireEquipe, type MatchLu } from "./sportcorico";
import { destinatairesResultat, envoyerNotification } from "./push";

/**
 * Rapprochement entre les scores lus sur SportCorico et nos matchs.
 *
 * Le rapprochement se fait sur le JOUR du match, pas sur le nom de
 * l'adversaire : nos matchs sont deja en base avec leur date, et les noms de
 * clubs s'ecrivent differemment d'une source a l'autre ("Bucy Long FC Billy 2"
 * chez nous, "Bucy le Long FC 2" chez eux).
 *
 * Deux garde-fous :
 *  - un score saisi a la main est verrouille, la synchro ne l'ecrase jamais ;
 *  - on ne previent que pour un resultat tout frais, pour qu'un premier
 *    lancement ne reveille pas tout le club avec la saison entiere.
 */

/** Au-dela, le resultat n'est plus une nouvelle : on ecrit sans notifier. */
const FRAICHEUR_HEURES = 48;

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

/** "2026-11-08" pour une date donnee, vue depuis la France. */
export function jourParis(d: Date) {
  return JOUR_PARIS.format(d);
}

export type LigneRapport = {
  equipe: string;
  jour: string;
  adversaire: string;
  score: string;
  /**
   * ecrit    : le score a ete enregistre
   * identique: deja le meme score, rien a faire
   * verrouille: score saisi a la main, laisse tel quel
   * inconnu  : aucun match de cette date en base
   */
  etat: "ecrit" | "identique" | "verrouille" | "inconnu";
  notifie?: number;
  /** Ce qui a ete lu sur la page, pour pouvoir verifier. */
  extrait?: string;
};

export type Rapport = {
  /** Vrai si rien n'a ete ecrit en base. */
  test: boolean;
  equipes: {
    nom: string;
    url: string;
    erreur?: string;
    datesVues: number;
    matchsLus: number;
    apercu?: string;
  }[];
  lignes: LigneRapport[];
  ecrits: number;
  notifications: number;
};

/**
 * Relit toutes les equipes qui ont une page SportCorico.
 * En mode test, rien n'est enregistre ni envoye : le rapport sert a verifier
 * que la lecture est juste avant de laisser la synchro tourner seule.
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
    ecrits: 0,
    notifications: 0,
  };

  const maintenant = Date.now();

  for (const equipe of equipes) {
    const lecture = await lireEquipe(equipe.sportcoricoUrl!);

    rapport.equipes.push({
      nom: equipe.name,
      url: lecture.url,
      erreur: lecture.erreur,
      datesVues: lecture.datesVues,
      matchsLus: lecture.matchs.length,
      // L'apercu n'a d'interet qu'en cas de probleme.
      apercu: lecture.erreur || lecture.matchs.length === 0 ? lecture.apercu : undefined,
    });

    if (lecture.erreur || lecture.matchs.length === 0) continue;

    // Tous nos matchs de la categorie, ranges par jour.
    const notres = await prisma.match.findMany({ where: { teamId: equipe.id } });
    const parJour = new Map<string, (typeof notres)[number]>();
    for (const m of notres) parJour.set(jourParis(m.kickoff), m);

    for (const lu of lecture.matchs) {
      const jour = jourParis(lu.jour);
      const ligne = await traiter({ equipe: equipe.name, lu, jour, notre: parJour.get(jour), test, maintenant });
      rapport.lignes.push(ligne);
      if (ligne.etat === "ecrit") rapport.ecrits++;
      rapport.notifications += ligne.notifie ?? 0;
    }
  }

  // Les plus recents d'abord : c'est ce qu'on veut relire.
  rapport.lignes.sort((a, b) => b.jour.localeCompare(a.jour));
  return rapport;
}

async function traiter(args: {
  equipe: string;
  lu: MatchLu;
  jour: string;
  notre?: Match;
  test: boolean;
  maintenant: number;
}): Promise<LigneRapport> {
  const { equipe, lu, jour, notre, test, maintenant } = args;

  const base = {
    equipe,
    jour,
    adversaire: lu.adversaire,
    score: `${lu.scoreUsap} – ${lu.scoreAdverse}${lu.domicile ? "" : " (extérieur)"}`,
    extrait: lu.extrait,
  };

  if (!notre) return { ...base, etat: "inconnu" };
  if (notre.scoreLocked) return { ...base, etat: "verrouille" };
  if (notre.scoreFor === lu.scoreUsap && notre.scoreAgainst === lu.scoreAdverse) {
    return { ...base, etat: "identique" };
  }

  if (test) return { ...base, etat: "ecrit" };

  await prisma.match.update({
    where: { id: notre.id },
    data: {
      scoreFor: lu.scoreUsap,
      scoreAgainst: lu.scoreAdverse,
      syncedAt: new Date(),
    },
  });

  // Une notification n'a de sens que pour un resultat qu'on apprend, et qui
  // vient de tomber. Une correction d'un vieux score ne reveille personne.
  const nouveau = notre.scoreFor == null || notre.scoreAgainst == null;
  const ageHeures = (maintenant - notre.kickoff.getTime()) / 3_600_000;
  if (!nouveau || ageHeures > FRAICHEUR_HEURES || ageHeures < 0) {
    return { ...base, etat: "ecrit", notifie: 0 };
  }

  const verdict =
    lu.scoreUsap > lu.scoreAdverse
      ? "Victoire"
      : lu.scoreUsap < lu.scoreAdverse
        ? "Défaite"
        : "Match nul";

  const cibles = await destinatairesResultat(notre.teamId);
  const { envoyees } = await envoyerNotification(cibles, {
    title: `${equipe} · ${verdict}`,
    body: lu.domicile
      ? `USAP ${lu.scoreUsap} – ${lu.scoreAdverse} ${notre.opponent}`
      : `${notre.opponent} ${lu.scoreAdverse} – ${lu.scoreUsap} USAP`,
    url: "/matchs",
  });

  return { ...base, etat: "ecrit", notifie: envoyees };
}
