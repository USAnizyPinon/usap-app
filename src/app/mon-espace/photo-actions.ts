"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deletePhoto } from "@/lib/storage";

type Etat = { ok: boolean; message: string };

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Le joueur propose une nouvelle photo.
 * Elle n'apparaît publiquement qu'après validation d'un dirigeant.
 */
export async function proposerPhoto(_prev: Etat | null, fd: FormData): Promise<Etat> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connectez-vous d'abord." };

  const url = str(fd, "photo");
  if (!url) return { ok: false, message: "Choisissez une photo." };

  const joueur = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true, pendingPhoto: true },
  });
  if (!joueur) {
    return { ok: false, message: "Vous n'êtes pas encore dans l'effectif." };
  }

  // Une proposition remplace la précédente : on nettoie l'ancienne
  if (joueur.pendingPhoto && joueur.pendingPhoto !== url) {
    await deletePhoto(joueur.pendingPhoto).catch(() => {});
  }

  await prisma.player.update({
    where: { id: joueur.id },
    data: { pendingPhoto: url, pendingAt: new Date() },
  });

  revalidatePath("/mon-espace");
  revalidatePath("/admin/photos");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Photo envoyée. Un dirigeant doit la valider avant qu'elle s'affiche.",
  };
}

/** Le joueur retire sa proposition. */
export async function annulerPhoto() {
  const session = await auth();
  if (!session?.user) return;

  const joueur = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true, pendingPhoto: true },
  });
  if (!joueur?.pendingPhoto) return;

  await deletePhoto(joueur.pendingPhoto).catch(() => {});
  await prisma.player.update({
    where: { id: joueur.id },
    data: { pendingPhoto: null, pendingAt: null },
  });

  revalidatePath("/mon-espace");
  revalidatePath("/admin/photos");
}
