import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth, canEdit } from "@/lib/auth";
import { synchroniserJeunesICS } from "@/lib/sportcorico-ics-sync";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!canEdit(session?.user?.role)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const test = new URL(req.url).searchParams.get("test") === "1";
  try {
    const rapport = await synchroniserJeunesICS(test);
    if (!test && rapport.crees + rapport.modifies > 0) {
      revalidatePath("/matchs"); revalidatePath("/equipes"); revalidatePath("/admin/matchs");
    }
    return NextResponse.json(rapport);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de lecture ICS." }, { status: 500 });
  }
}
