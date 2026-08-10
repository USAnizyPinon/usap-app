"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth";
import { slugify, formatDateTime } from "@/lib/format";
import { deletePhoto } from "@/lib/storage";
import { destinatairesActu, destinatairesMatch, envoyerNotification } from "@/lib/push";
import type { BoardGroup, Competition } from "@prisma/client";

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

    await prisma.match.update({ where: { id }, data: { scoreFor, scoreAgainst } });
    refreshAll();
    return { ok: true, message: "Score enregistré." };
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
        title: "US Anizy-Pinon",
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
