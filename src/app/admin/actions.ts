"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth";
import { slugify, formatDateTime } from "@/lib/format";
import { deletePhoto } from "@/lib/storage";
import {
  destinatairesActu,
  destinatairesMatch,
  destinatairesResultat,
  envoyerNotification,
} from "@/lib/push";
import type { BoardGroup, Competition, NameDisplay } from "@prisma/client";

type Etat = { ok: boolean; message: string };

/** Petit utilitaire : lit un champ texte du formulaire. */
function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/matchs");
  revalidatePath("/equipes");
  revalidatePath("/actus");
  revalidatePath("/club");
  revalidatePath("/admin");
  revalidatePath("/admin/matchs");
  revalidatePath("/admin/effectif");
  revalidatePath("/admin/actus");
}

/* ==========================================================
   MATCHS
   ========================================================== */

export async function creerMatch(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();

    const teamId = str(fd, "teamId");
    const opponent = str(fd, "opponent");
    const kickoff = str(fd, "kickoff");

    if (!teamId) return { ok: false, message: "Choisissez une équipe." };
    if (!opponent) return { ok: false, message: "Indiquez l'adversaire." };
    if (!kickoff) return { ok: false, message: "Indiquez la date et l'heure." };

    const match = await prisma.match.create({
      data: {
        teamId,
        opponent,
        opponentLogo: str(fd, "opponentLogo") || null,
        kickoff: new Date(kickoff),
        home: str(fd, "home") === "true",
        competition: (str(fd, "competition") || "CHAMPIONNAT") as Competition,
        venue: str(fd, "venue") || null,
      },
      include: { team: { select: { name: true } } },
    });

    refreshAll();

    // Prevenir les personnes qui suivent cette categorie
    let info = "";
    if (str(fd, "notifier") === "on") {
      const cibles = await destinatairesMatch(teamId);
      const { envoyees } = await envoyerNotification(cibles, {
        title: `${match.team.name} — nouveau match`,
        body: `${match.home ? "Contre" : "À"} ${opponent} · ${formatDateTime(match.kickoff)}`,
        url: "/matchs",
      });
      info = envoyees > 0 ? ` ${envoyees} personne(s) prévenue(s).` : "";
    }

    return { ok: true, message: `Match contre ${opponent} ajouté.${info}` };
  } catch {
    return { ok: false, message: "Enregistrement impossible. Vérifiez vos droits." };
  }
}

export async function enregistrerScore(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const id = str(fd, "matchId");
    const scoreFor = num(fd, "scoreFor");
    const scoreAgainst = num(fd, "scoreAgainst");

    if (scoreFor == null || scoreAgainst == null) {
      return { ok: false, message: "Saisissez les deux scores." };
    }

    const match = await prisma.match.update({
      where: { id },
      data: { scoreFor, scoreAgainst },
      include: { team: { select: { name: true } } },
    });
    refreshAll();

    let info = "";
    if (str(fd, "notifier") === "on") {
      const cibles = await destinatairesResultat(match.teamId);
      const verdict =
        scoreFor > scoreAgainst ? "Victoire" : scoreFor < scoreAgainst ? "Défaite" : "Match nul";
      const { envoyees } = await envoyerNotification(cibles, {
        title: `${match.team.name} · ${verdict}`,
        body: `${match.home ? "USAP" : match.opponent} ${match.home ? scoreFor : scoreAgainst} – ${
          match.home ? scoreAgainst : scoreFor
        } ${match.home ? match.opponent : "USAP"}`,
        url: "/matchs",
      });
      info = envoyees > 0 ? ` ${envoyees} personne(s) prévenue(s).` : "";
    }

    return { ok: true, message: `Score enregistré.${info}` };
  } catch {
    return { ok: false, message: "Enregistrement impossible." };
  }
}

export async function modifierMatch(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const opponent = str(fd, "opponent");
    const kickoff = str(fd, "kickoff");
    if (!opponent) return { ok: false, message: "Indiquez l'adversaire." };
    if (!kickoff) return { ok: false, message: "Indiquez la date et l'heure." };

    await prisma.match.update({
      where: { id: str(fd, "matchId") },
      data: {
        teamId: str(fd, "teamId"),
        opponent,
        opponentLogo: str(fd, "opponentLogo") || null,
        kickoff: new Date(kickoff),
        home: str(fd, "home") === "true",
        competition: (str(fd, "competition") || "CHAMPIONNAT") as Competition,
        venue: str(fd, "venue") || null,
        scoreFor: num(fd, "scoreFor"),
        scoreAgainst: num(fd, "scoreAgainst"),
      },
    });

    refreshAll();
    return { ok: true, message: "Match modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

/** Vide le calendrier d'une categorie : pratique apres un import a refaire. */
export async function viderCalendrier(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const teamId = str(fd, "teamId");
    if (!teamId) return { ok: false, message: "Choisissez une catégorie." };

    // On ne touche pas aux matchs dont le score est deja saisi
    const { count } = await prisma.match.deleteMany({
      where: { teamId, scoreFor: null },
    });

    refreshAll();
    return {
      ok: true,
      message:
        count === 0
          ? "Aucun match à supprimer (ceux avec un score sont conservés)."
          : `${count} match(s) supprimé(s). Les matchs avec un score ont été conservés.`,
    };
  } catch {
    return { ok: false, message: "Suppression impossible." };
  }
}

export async function supprimerMatch(fd: FormData) {
  await requireEditor();
  await prisma.match.delete({ where: { id: str(fd, "matchId") } });
  refreshAll();
}

/* ==========================================================
   EFFECTIFS
   ========================================================== */

export async function ajouterJoueur(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    const teamId = str(fd, "teamId");
    if (!firstName) return { ok: false, message: "Le prénom est obligatoire." };
    if (!teamId) return { ok: false, message: "Choisissez une équipe." };

    await prisma.player.create({
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        teamId,
        position: str(fd, "position") || null,
        number: num(fd, "number"),
        photo: str(fd, "photo") || null,
      },
    });

    refreshAll();
    return { ok: true, message: `${firstName} ajouté à l'effectif.` };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function supprimerJoueur(fd: FormData) {
  await requireEditor();
  const joueur = await prisma.player.delete({ where: { id: str(fd, "playerId") } });
  if (joueur.photo) await deletePhoto(joueur.photo).catch(() => {});
  refreshAll();
}

export async function modifierJoueur(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    if (!firstName) return { ok: false, message: "Le prénom est obligatoire." };

    await prisma.player.update({
      where: { id: str(fd, "playerId") },
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        teamId: str(fd, "teamId"),
        position: str(fd, "position") || null,
        number: num(fd, "number"),
        photo: str(fd, "photo") || null,
        publicPhoto: str(fd, "publicPhoto") === "on",
        nameDisplay: (str(fd, "nameDisplay") || "COMPLET") as NameDisplay,
      },
    });

    refreshAll();
    return { ok: true, message: "Joueur modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

/** Change le role d'un membre (ADMIN uniquement dans l'interface). */
export async function changerRole(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    const session = await requireEditor();
    if (session.user.role !== "ADMIN") {
      return { ok: false, message: "Seul un administrateur peut changer les rôles." };
    }
    const userId = str(fd, "userId");
    const role = str(fd, "role") as "LICENCIE" | "DIRIGEANT" | "ADMIN";

    if (userId === session.user.id) {
      return { ok: false, message: "Vous ne pouvez pas modifier votre propre rôle." };
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    refreshAll();
    return { ok: true, message: "Rôle mis à jour." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

/* ==========================================================
   ACTUALITES
   ========================================================== */

export async function publierActu(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const title = str(fd, "title");
    const excerpt = str(fd, "excerpt");
    if (!title) return { ok: false, message: "Donnez un titre." };
    if (!excerpt) return { ok: false, message: "Écrivez un résumé." };

    // Un slug unique meme si deux actus portent le meme titre.
    const base = slugify(title);
    const existe = await prisma.news.count({ where: { slug: base } });
    const slug = existe > 0 ? `${base}-${Date.now().toString().slice(-4)}` : base;

    await prisma.news.create({
      data: {
        title,
        slug,
        excerpt,
        body: str(fd, "body") || null,
        tag: str(fd, "tag") || "Club",
        image: str(fd, "image") || null,
      },
    });

    refreshAll();

    let info = "";
    if (str(fd, "notifier") === "on") {
      const cibles = await destinatairesActu();
      const { envoyees } = await envoyerNotification(cibles, {
        title: "US Anizy Pinon",
        body: title,
        url: "/actus",
      });
      info = envoyees > 0 ? ` ${envoyees} personne(s) prévenue(s).` : "";
    }

    return { ok: true, message: `Actualité publiée.${info}` };
  } catch {
    return { ok: false, message: "Publication impossible." };
  }
}

export async function supprimerActu(fd: FormData) {
  await requireEditor();
  const actu = await prisma.news.delete({ where: { id: str(fd, "newsId") } });
  if (actu.image) await deletePhoto(actu.image).catch(() => {});
  refreshAll();
}

export async function modifierActu(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const title = str(fd, "title");
    const excerpt = str(fd, "excerpt");
    if (!title) return { ok: false, message: "Donnez un titre." };
    if (!excerpt) return { ok: false, message: "Écrivez un résumé." };

    await prisma.news.update({
      where: { id: str(fd, "newsId") },
      data: {
        title,
        excerpt,
        body: str(fd, "body") || null,
        tag: str(fd, "tag") || "Club",
        image: str(fd, "image") || null,
        published: str(fd, "published") === "on",
      },
    });

    refreshAll();
    return { ok: true, message: "Actualité modifiée." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

/* ==========================================================
   BUREAU
   ========================================================== */

export async function ajouterMembreBureau(
  _prev: Etat | null,
  fd: FormData
): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    const role = str(fd, "role");
    if (!firstName || !role) {
      return { ok: false, message: "Prénom et fonction sont obligatoires." };
    }

    await prisma.boardMember.create({
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        role,
        group: (str(fd, "group") || "BUREAU") as BoardGroup,
        photo: str(fd, "photo") || null,
        order: num(fd, "order") ?? 0,
      },
    });

    refreshAll();
    return { ok: true, message: "Membre ajouté." };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function modifierMembreBureau(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    const role = str(fd, "role");
    if (!firstName || !role) {
      return { ok: false, message: "Prénom et fonction sont obligatoires." };
    }

    await prisma.boardMember.update({
      where: { id: str(fd, "memberId") },
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        role,
        group: (str(fd, "group") || "BUREAU") as BoardGroup,
        photo: str(fd, "photo") || null,
        order: num(fd, "order") ?? 0,
      },
    });

    refreshAll();
    return { ok: true, message: "Membre modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

export async function supprimerMembreBureau(fd: FormData) {
  await requireEditor();
  const m = await prisma.boardMember.delete({ where: { id: str(fd, "memberId") } });
  if (m.photo) await deletePhoto(m.photo).catch(() => {});
  refreshAll();
}

/* ==========================================================
   ENCADREMENT (educateurs / entraineurs)
   ========================================================== */

export async function ajouterStaff(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    if (!firstName) return { ok: false, message: "Le prénom est obligatoire." };

    await prisma.staff.create({
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        role: str(fd, "role") || "Éducateur",
        teamId: str(fd, "teamId") || null,
        photo: str(fd, "photo") || null,
      },
    });

    refreshAll();
    return { ok: true, message: `${firstName} ajouté à l'encadrement.` };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function modifierStaff(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const firstName = str(fd, "firstName");
    if (!firstName) return { ok: false, message: "Le prénom est obligatoire." };

    await prisma.staff.update({
      where: { id: str(fd, "staffId") },
      data: {
        firstName,
        lastName: str(fd, "lastName"),
        role: str(fd, "role") || "Éducateur",
        teamId: str(fd, "teamId") || null,
        photo: str(fd, "photo") || null,
      },
    });

    refreshAll();
    return { ok: true, message: "Encadrant modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

export async function supprimerStaff(fd: FormData) {
  await requireEditor();
  const st = await prisma.staff.delete({ where: { id: str(fd, "staffId") } });
  if (st.photo) await deletePhoto(st.photo).catch(() => {});
  refreshAll();
}

/* ==========================================================
   IMPORT DU CALENDRIER FOOTCLUBS
   ========================================================== */

export type MatchAImporter = {
  kickoff: string; // date au format ISO
  opponent: string;
  home: boolean;
  competition: Competition;
  venue: string | null;
};

/**
 * Cree les matchs d'une categorie a partir de l'extraction Footclubs.
 * Les rencontres deja enregistrees sont ignorees (meme date, meme adversaire).
 */
export async function importerCalendrier(
  teamId: string,
  matchs: MatchAImporter[]
): Promise<Etat> {
  try {
    await requireEditor();
    if (!teamId) return { ok: false, message: "Choisissez une catégorie." };
    if (matchs.length === 0) return { ok: false, message: "Aucun match à importer." };

    const existants = await prisma.match.findMany({
      where: { teamId },
      select: { kickoff: true, opponent: true },
    });

    // Deux matchs sont identiques s'ils tombent le meme jour contre le meme adversaire
    const cle = (d: Date, adv: string) =>
      `${d.toISOString().slice(0, 10)}|${adv.toLowerCase().trim()}`;
    const deja = new Set(existants.map((e) => cle(e.kickoff, e.opponent)));

    const aCreer = matchs.filter((m) => !deja.has(cle(new Date(m.kickoff), m.opponent)));

    if (aCreer.length === 0) {
      return { ok: true, message: "Tous ces matchs étaient déjà enregistrés." };
    }

    await prisma.match.createMany({
      data: aCreer.map((m) => ({
        teamId,
        opponent: m.opponent,
        kickoff: new Date(m.kickoff),
        home: m.home,
        competition: m.competition,
        venue: m.venue,
      })),
    });

    refreshAll();

    const ignores = matchs.length - aCreer.length;
    return {
      ok: true,
      message:
        `${aCreer.length} match(s) importé(s).` +
        (ignores > 0 ? ` ${ignores} déjà présent(s), ignoré(s).` : ""),
    };
  } catch {
    return { ok: false, message: "Import impossible. Vérifiez vos droits." };
  }
}

/* ==========================================================
   DROIT A L'IMAGE : reglages pour toute une categorie
   Pratique pour les equipes de jeunes.
   ========================================================== */

export async function reglerVisibiliteEquipe(fd: FormData): Promise<void> {
  await requireEditor();
  const teamId = str(fd, "teamId");
  const action = str(fd, "reglage");
  if (!teamId) return;

  const data: { publicPhoto?: boolean; nameDisplay?: NameDisplay } = {};

  if (action === "photos-off") data.publicPhoto = false;
  else if (action === "photos-on") data.publicPhoto = true;
  else if (action === "nom-initiale") data.nameDisplay = "INITIALE";
  else if (action === "nom-prenom") data.nameDisplay = "PRENOM";
  else if (action === "nom-complet") data.nameDisplay = "COMPLET";
  else return;

  await prisma.player.updateMany({ where: { teamId }, data });
  refreshAll();
}

/* ==========================================================
   DROIT A L'IMAGE : reglages par categorie
   ========================================================== */

/** Applique un mode d'affichage du nom a toute une categorie. */
export async function appliquerAffichageNom(fd: FormData) {
  await requireEditor();
  const teamId = str(fd, "teamId");
  const mode = (str(fd, "nameDisplay") || "COMPLET") as NameDisplay;
  await prisma.player.updateMany({ where: { teamId }, data: { nameDisplay: mode } });
  refreshAll();
}

/** Masque ou reaffiche toutes les photos d'une categorie. */
export async function appliquerPhotos(fd: FormData) {
  await requireEditor();
  const teamId = str(fd, "teamId");
  const visible = str(fd, "visible") === "true";
  await prisma.player.updateMany({ where: { teamId }, data: { publicPhoto: visible } });
  refreshAll();
}
