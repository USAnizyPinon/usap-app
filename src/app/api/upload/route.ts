import { NextResponse } from "next/server";
import { auth, canEdit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";

export const runtime = "nodejs";

const MAX = 8 * 1024 * 1024; // 8 Mo : large, un PNG recadre reste bien en dessous

// Formats acceptes -> extension du fichier stocke
const FORMATS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Connectez-vous pour ajouter une photo." },
      { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const prefix = (form.get("prefix") as string) || "photo";
  const usage = (form.get("usage") as string) || "";

  /**
   * Un dirigeant depose ce qu'il veut.
   * Un licencie ne peut envoyer qu'une photo pour sa propre demande,
   * et une seule fois tant qu'elle n'est pas traitee.
   */
  if (!canEdit(session.user.role)) {
    if (usage !== "demande") {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour ajouter une photo." },
        { status: 403 }
      );
    }

    const dejaJoueur = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (dejaJoueur) {
      return NextResponse.json(
        { error: "Votre fiche existe déjà : demandez à un dirigeant de la modifier." },
        { status: 403 }
      );
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json(
      { error: "Image trop lourde (8 Mo maximum)." },
      { status: 400 }
    );
  }

  const ext = FORMATS[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format non accepté. Utilisez une image JPG ou PNG." },
      { status: 400 }
    );
  }

  const slug = prefix
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const name = `${slug || "photo"}-${Date.now()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPhoto(buffer, name, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Envoi impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
