import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";

export const runtime = "nodejs";

const MAX = 6 * 1024 * 1024; // 6 Mo apres recadrage : largement suffisant

export async function POST(req: Request) {
  try {
    await requireEditor();
  } catch {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour ajouter une photo." },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const prefix = (form.get("prefix") as string) || "photo";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Image trop lourde." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Ce fichier n'est pas une image." }, { status: 400 });
  }

  const slug = prefix
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const name = `${slug || "photo"}-${Date.now()}.jpg`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPhoto(buffer, name, "image/jpeg");
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Envoi impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
