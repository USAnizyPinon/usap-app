import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { synchroniser, passageRecent, noterPassage } from "@/lib/sportcorico-sync";
import { synchroniserJeunesICS } from "@/lib/sportcorico-ics-sync";
import { synchroniserPlateaux } from "@/lib/sportcorico-plateaux";
import { auth, canEdit } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const DELAI_MINUTES = 15;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const test = url.searchParams.get("test") === "1";
  const auto = url.searchParams.get("auto") === "1";
  const secret = process.env.CRON_SECRET;
  const signe = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!signe && !auto) {
    const session = await auth();
    if (!canEdit(session?.user?.role)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (auto) {
    if (await passageRecent(DELAI_MINUTES)) return NextResponse.json({ ignore: true, raison: "Déjà relu récemment." });
    await noterPassage();
  }
  try {
    const rapport = await synchroniser({ test });
    let icsErreur: string | null = null;
    try {
      const ics = await synchroniserJeunesICS(test);
      rapport.crees += ics.crees;
      rapport.modifies += ics.modifies;
    } catch (e) { icsErreur = e instanceof Error ? e.message : "Erreur ICS"; }
    const plateaux = await synchroniserPlateaux(test);
    if (!test) {
      if (!auto) await noterPassage();
      if (rapport.crees + rapport.modifies + plateaux.modifies > 0) {
        revalidatePath("/"); revalidatePath("/matchs"); revalidatePath("/equipes"); revalidatePath("/admin/matchs");
      }
    }
    return NextResponse.json({ ...rapport, icsErreur, plateaux });
  } catch (e) {
    return NextResponse.json({ error: `Synchronisation impossible (${e instanceof Error ? e.message : "erreur inconnue"}).` }, { status: 500 });
  }
}
