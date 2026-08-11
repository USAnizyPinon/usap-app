"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireEditor } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { deletePhoto } from "@/lib/storage";
import { destinatairesEvenement, envoyerNotification } from "@/lib/push";
import type { PartnerTier } from "@prisma/client";

type Etat = { ok: boolean; message: string };

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function int(fd: FormData, key: string, defaut = 0) {
  const n = Number(str(fd, key));
  return Number.isFinite(n) ? Math.trunc(n) : defaut;
}

function refresh() {
  for (const p of [
    "/",
    "/classement",
    "/galerie",
    "/partenaires",
    "/evenements",
    "/bureaux",
    "/admin",
    "/admin/classement",
    "/admin/galerie",
    "/admin/partenaires",
    "/admin/evenements",
    "/mon-espace",
  ]) {
    revalidatePath(p);
  }
}

/* ==========================================================
   CLASSEMENT
   ========================================================== */

export async function ajouterLigneClassement(
  _prev: Etat | null,
  fd: FormData
): Promise<Etat> {
  try {
    await requireEditor();
    const teamId = str(fd, "teamId");
    const clubName = str(fd, "clubName");
    if (!teamId) return { ok: false, message: "Choisissez une catégorie." };
    if (!clubName) return { ok: false, message: "Indiquez le nom du club." };

    await prisma.standingRow.create({
      data: {
        teamId,
        clubName,
        position: int(fd, "position", 1),
        isUsap: str(fd, "isUsap") === "on",
        played: int(fd, "played"),
        won: int(fd, "won"),
        drawn: int(fd, "drawn"),
        lost: int(fd, "lost"),
        goalsFor: int(fd, "goalsFor"),
        goalsAgainst: int(fd, "goalsAgainst"),
      },
    });

    refresh();
    return { ok: true, message: `${clubName} ajouté au classement.` };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function modifierLigneClassement(
  _prev: Etat | null,
  fd: FormData
): Promise<Etat> {
  try {
    await requireEditor();
    await prisma.standingRow.update({
      where: { id: str(fd, "rowId") },
      data: {
        clubName: str(fd, "clubName"),
        position: int(fd, "position", 1),
        isUsap: str(fd, "isUsap") === "on",
        played: int(fd, "played"),
        won: int(fd, "won"),
        drawn: int(fd, "drawn"),
        lost: int(fd, "lost"),
        goalsFor: int(fd, "goalsFor"),
        goalsAgainst: int(fd, "goalsAgainst"),
      },
    });
    refresh();
    return { ok: true, message: "Ligne mise à jour." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

export async function supprimerLigneClassement(fd: FormData) {
  await requireEditor();
  await prisma.standingRow.delete({ where: { id: str(fd, "rowId") } });
  refresh();
}

/* ==========================================================
   GALERIE
   ========================================================== */

export async function ajouterPhoto(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const url = str(fd, "url");
    if (!url) return { ok: false, message: "Choisissez une photo." };

    await prisma.photo.create({
      data: {
        url,
        caption: str(fd, "caption") || null,
        season: str(fd, "season") || "2025/2026",
        teamId: str(fd, "teamId") || null,
      },
    });

    refresh();
    return { ok: true, message: "Photo ajoutée à la galerie." };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function supprimerPhoto(fd: FormData) {
  await requireEditor();
  const photo = await prisma.photo.delete({ where: { id: str(fd, "photoId") } });
  await deletePhoto(photo.url).catch(() => {});
  refresh();
}

/* ==========================================================
   PARTENAIRES
   ========================================================== */

export async function ajouterPartenaire(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const name = str(fd, "name");
    if (!name) return { ok: false, message: "Indiquez le nom du partenaire." };

    const base = slugify(name);
    const existe = await prisma.partner.count({ where: { slug: base } });
    const slug = existe > 0 ? `${base}-${Date.now().toString().slice(-4)}` : base;

    await prisma.partner.create({
      data: {
        name,
        slug,
        logo: str(fd, "logo") || null,
        website: str(fd, "website") || null,
        description: str(fd, "description") || null,
        address: str(fd, "address") || null,
        tier: (str(fd, "tier") || "OFFICIEL") as PartnerTier,
        order: int(fd, "order"),
      },
    });

    refresh();
    return { ok: true, message: `${name} ajouté aux partenaires.` };
  } catch {
    return { ok: false, message: "Ajout impossible." };
  }
}

export async function modifierPartenaire(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const name = str(fd, "name");
    if (!name) return { ok: false, message: "Indiquez le nom du partenaire." };

    await prisma.partner.update({
      where: { id: str(fd, "partnerId") },
      data: {
        name,
        logo: str(fd, "logo") || null,
        website: str(fd, "website") || null,
        description: str(fd, "description") || null,
        address: str(fd, "address") || null,
        tier: (str(fd, "tier") || "OFFICIEL") as PartnerTier,
        order: int(fd, "order"),
        visible: str(fd, "visible") === "on",
      },
    });

    refresh();
    return { ok: true, message: "Partenaire modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

export async function supprimerPartenaire(fd: FormData) {
  await requireEditor();
  const p = await prisma.partner.delete({ where: { id: str(fd, "partnerId") } });
  if (p.logo) await deletePhoto(p.logo).catch(() => {});
  refresh();
}

/* ==========================================================
   EVENEMENTS
   ========================================================== */

export async function creerEvenement(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const title = str(fd, "title");
    const startsAt = str(fd, "startsAt");
    if (!title) return { ok: false, message: "Donnez un nom à l'événement." };
    if (!startsAt) return { ok: false, message: "Indiquez la date." };

    const base = slugify(title);
    const existe = await prisma.event.count({ where: { slug: base } });
    const slug = existe > 0 ? `${base}-${Date.now().toString().slice(-4)}` : base;

    await prisma.event.create({
      data: {
        title,
        slug,
        description: str(fd, "description") || null,
        startsAt: new Date(startsAt),
        place: str(fd, "place") || null,
        image: str(fd, "image") || null,
        openToSignup: str(fd, "openToSignup") === "on",
        capacity: str(fd, "capacity") ? int(fd, "capacity") : null,
      },
    });

    refresh();

    let info = "";
    if (str(fd, "notifier") === "on") {
      const cibles = await destinatairesEvenement();
      const { envoyees } = await envoyerNotification(cibles, {
        title: "US Anizy Pinon",
        body: `Nouvel événement : ${title}`,
        url: "/evenements",
      });
      info = envoyees > 0 ? ` ${envoyees} personne(s) prévenue(s).` : "";
    }

    return { ok: true, message: `Événement créé.${info}` };
  } catch {
    return { ok: false, message: "Création impossible." };
  }
}

export async function modifierEvenement(_prev: Etat | null, fd: FormData): Promise<Etat> {
  try {
    await requireEditor();
    const title = str(fd, "title");
    const startsAt = str(fd, "startsAt");
    if (!title) return { ok: false, message: "Donnez un nom à l'événement." };
    if (!startsAt) return { ok: false, message: "Indiquez la date." };

    await prisma.event.update({
      where: { id: str(fd, "eventId") },
      data: {
        title,
        description: str(fd, "description") || null,
        startsAt: new Date(startsAt),
        place: str(fd, "place") || null,
        image: str(fd, "image") || null,
        openToSignup: str(fd, "openToSignup") === "on",
        capacity: str(fd, "capacity") ? int(fd, "capacity") : null,
        published: str(fd, "published") === "on",
      },
    });

    refresh();
    return { ok: true, message: "Événement modifié." };
  } catch {
    return { ok: false, message: "Modification impossible." };
  }
}

export async function supprimerEvenement(fd: FormData) {
  await requireEditor();
  const e = await prisma.event.delete({ where: { id: str(fd, "eventId") } });
  if (e.image) await deletePhoto(e.image).catch(() => {});
  refresh();
}

/* ==========================================================
   INSCRIPTIONS AUX EVENEMENTS  (cote licencie)
   ========================================================== */

export async function sInscrire(_prev: Etat | null, fd: FormData): Promise<Etat> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Connectez-vous pour vous inscrire." };
  }

  const eventId = str(fd, "eventId");
  const people = Math.max(1, int(fd, "people", 1));

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { registrations: { select: { people: true, userId: true } } },
  });

  if (!event) return { ok: false, message: "Événement introuvable." };
  if (!event.openToSignup) return { ok: false, message: "Les inscriptions sont fermées." };

  // Verifier les places restantes (sans compter sa propre inscription)
  if (event.capacity) {
    const dejaPris = event.registrations
      .filter((r) => r.userId !== session.user.id)
      .reduce((t, r) => t + r.people, 0);
    if (dejaPris + people > event.capacity) {
      const reste = Math.max(0, event.capacity - dejaPris);
      return {
        ok: false,
        message:
          reste === 0
            ? "Il n'y a plus de place."
            : `Il ne reste que ${reste} place(s).`,
      };
    }
  }

  await prisma.registration.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: { people, comment: str(fd, "comment") || null },
    create: {
      eventId,
      userId: session.user.id,
      people,
      comment: str(fd, "comment") || null,
    },
  });

  revalidatePath("/evenements");
  revalidatePath("/mon-espace");
  return {
    ok: true,
    message: `Inscription enregistrée pour ${people} personne${people > 1 ? "s" : ""}.`,
  };
}

export async function seDesinscrire(fd: FormData) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.registration.deleteMany({
    where: { eventId: str(fd, "eventId"), userId: session.user.id },
  });

  revalidatePath("/evenements");
  revalidatePath("/mon-espace");
}
