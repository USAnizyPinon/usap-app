"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireEditor } from "@/lib/auth";
import { envoyerNotification } from "@/lib/push";

type Etat = { ok: boolean; message: string };

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function refresh() {
  for (const p of ["/mon-espace", "/equipes", "/admin", "/admin/demandes", "/admin/effectif"]) {
    revalidatePath(p);
  }
}

/** Compare deux noms sans tenir compte des accents ni de la casse. */
function normaliser(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * Cherche une fiche existante au même nom, sans compte rattaché.
 * Évite qu'un licencié déjà à l'effectif crée un doublon.
 */
export async function chercherFiche(prenom: string, nom: string) {
  if (!prenom || !nom) return [];

  const candidats = await prisma.player.findMany({
    where: { userId: null },
    include: { team: { select: { name: true } } },
  });

  const p = normaliser(prenom);
  const n = normaliser(nom);

  return candidats
    .filter(
      (c) => normaliser(c.firstName) === p && normaliser(c.lastName) === n
    )
    .map((c) => ({
      id: c.id,
      nom: `${c.firstName} ${c.lastName}`,
      equipe: c.team.name,
      photo: c.photo,
    }));
}

/**
 * Le licencié se reconnaît dans une fiche existante : on rattache son compte.
 * Un dirigeant n'a rien à valider, le nom correspond déjà à l'effectif.
 */
export async function rattacherAFiche(_prev: Etat | null, fd: FormData): Promise<Etat> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connectez-vous d'abord." };

  const playerId = str(fd, "playerId");
  const fiche = await prisma.player.findUnique({
    where: { id: playerId },
    select: { userId: true, firstName: true },
  });

  if (!fiche) return { ok: false, message: "Fiche introuvable." };
  if (fiche.userId) {
    return { ok: false, message: "Cette fiche est déjà rattachée à un compte." };
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { userId: session.user.id },
  });

  // Une éventuelle demande en cours n'a plus lieu d'être
  await prisma.joinRequest.deleteMany({ where: { userId: session.user.id } });

  refresh();
  return {
    ok: true,
    message: `Bienvenue ${fiche.firstName} ! Votre compte est relié à votre fiche.`,
  };
}

/* ==========================================================
   COTE LICENCIE : envoyer sa demande
   ========================================================== */

export async function envoyerDemande(_prev: Etat | null, fd: FormData): Promise<Etat> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connectez-vous d'abord." };

  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const choix = str(fd, "choix"); // "supporter" ou l'identifiant d'une equipe

  if (!firstName) return { ok: false, message: "Indiquez votre prénom." };
  if (!lastName) return { ok: false, message: "Indiquez votre nom." };
  if (!choix) return { ok: false, message: "Choisissez une catégorie ou « supporter »." };

  const supporter = choix === "supporter";

  // Deja dans l'effectif : rien a demander
  const dejaJoueur = await prisma.player.findUnique({
    where: { userId: session.user.id },
  });
  if (dejaJoueur) {
    return { ok: false, message: "Vous faites déjà partie de l'effectif." };
  }

  await prisma.joinRequest.upsert({
    where: { userId: session.user.id },
    update: {
      firstName,
      lastName,
      photo: str(fd, "photo") || null,
      teamId: supporter ? null : choix,
      supporter,
      message: str(fd, "message") || null,
      status: "EN_ATTENTE",
      reason: null,
      decidedAt: null,
    },
    create: {
      userId: session.user.id,
      firstName,
      lastName,
      photo: str(fd, "photo") || null,
      teamId: supporter ? null : choix,
      supporter,
      message: str(fd, "message") || null,
    },
  });

  // Prevenir les dirigeants qu'une demande attend
  const dirigeants = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "DIRIGEANT"] }, subscriptions: { some: {} } },
    select: { id: true },
  });
  await envoyerNotification(
    dirigeants.map((d) => d.id),
    {
      title: "Nouvelle demande",
      body: `${firstName} ${lastName} souhaite rejoindre le club.`,
      url: "/admin/demandes",
    }
  );

  refresh();
  return {
    ok: true,
    message: "Demande envoyée. Un dirigeant va la valider.",
  };
}

export async function annulerDemande() {
  const session = await auth();
  if (!session?.user) return;
  await prisma.joinRequest.deleteMany({ where: { userId: session.user.id } });
  refresh();
}

/* ==========================================================
   COTE DIRIGEANT : accepter ou refuser
   ========================================================== */

export async function accepterDemande(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const id = str(fd, "requestId");

    const demande = await prisma.joinRequest.findUnique({ where: { id } });
    if (!demande) return { ok: false, message: "Demande introuvable." };

    if (demande.supporter) {
      // Supporter : on marque le compte, sans entrer dans un effectif
      await prisma.user.update({
        where: { id: demande.userId },
        data: { supporter: true },
      });
    } else {
      if (!demande.teamId) {
        return { ok: false, message: "Cette demande n'a pas de catégorie." };
      }
      // Joueur : creation de la fiche, rattachee au compte
      await prisma.player.create({
        data: {
          firstName: demande.firstName,
          lastName: demande.lastName,
          photo: demande.photo,
          teamId: demande.teamId,
          userId: demande.userId,
        },
      });
    }

    await prisma.joinRequest.update({
      where: { id },
      data: { status: "ACCEPTEE", decidedAt: new Date(), reason: null },
    });

    await envoyerNotification([demande.userId], {
      title: demande.supporter ? "Inscription validée" : "Bienvenue au club",
      body: demande.supporter
        ? "Votre inscription comme supporter est validée."
        : "Vous faites maintenant partie de l'effectif.",
      url: "/mon-espace",
    });

    refresh();
    return {
      ok: true,
      message: `${demande.firstName} ${demande.lastName} a été accepté.`,
    };
  } catch {
    return { ok: false, message: "Validation impossible." };
  }
}

export async function refuserDemande(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const id = str(fd, "requestId");
    const reason = str(fd, "reason");

    const demande = await prisma.joinRequest.update({
      where: { id },
      data: { status: "REFUSEE", reason: reason || null, decidedAt: new Date() },
    });

    await envoyerNotification([demande.userId], {
      title: "Réponse à votre demande",
      body: "Votre demande n'a pas été retenue. Rendez-vous dans Mon compte.",
      url: "/mon-espace",
    });

    refresh();
    return { ok: true, message: "Demande refusée." };
  } catch {
    return { ok: false, message: "Opération impossible." };
  }
}

export async function supprimerDemande(fd: FormData) {
  await requireEditor();
  await prisma.joinRequest.delete({ where: { id: str(fd, "requestId") } });
  refresh();
}
