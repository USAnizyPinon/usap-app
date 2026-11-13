import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth, canEdit } from "@/lib/auth";
import { synchroniserPlateaux } from "@/lib/sportcorico-plateaux";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  const session = await auth();
  if (!canEdit(session?.user?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const test = new URL(req.url).searchParams.get("test") === "1";
  const rapport = await synchroniserPlateaux(test);
  if (!test && rapport.modifies) revalidatePath("/matchs");
  return NextResponse.json(rapport);
}
