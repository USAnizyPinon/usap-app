"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Etat = { ok: boolean; message: string };

/** Enregistre les categories suivies et les preferences de notification. */
export async function enregistrerPreferences(
  _prev: Etat | null,
  fd: FormData
): Promise<Etat> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connectez-vous d'abord." };

  const equipes = fd.getAll("teams").map(String).filter(Boolean);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      notifyMatches: fd.get("notifyMatches") === "on",
      notifyNews: fd.get("notifyNews") === "on",
      favorites: { set: equipes.map((id) => ({ id })) },
    },
  });

  revalidatePath("/mon-espace");
  return {
    ok: true,
    message:
      equipes.length === 0
        ? "Préférences enregistrées. Vous ne suivez aucune catégorie pour l'instant."
        : `Préférences enregistrées pour ${equipes.length} catégorie(s).`,
  };
}
