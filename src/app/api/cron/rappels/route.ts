import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { destinatairesMatch, envoyerNotification } from "@/lib/push";
import { COMPETITION_LABEL, formatTime } from "@/lib/format";
import { synchroniserJeunesICS } from "@/lib/sportcorico-ics-sync";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cron Hobby unique : import ICS des jeunes, puis rappels des matchs à venir. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  let ics: { crees: number; modifies: number; lus: number } | null = null;
  let icsErreur: string | null = null;
  try {
    ics = await synchroniserJeunesICS(false);
    if (ics.crees + ics.modifies > 0) {
      revalidatePath("/matchs"); revalidatePath("/equipes"); revalidatePath("/admin/matchs");
    }
  } catch (e) {
    icsErreur = e instanceof Error ? e.message : "Erreur ICS";
  }

  const maintenant = new Date();
  const dans36h = new Date(maintenant.getTime() + 36 * 60 * 60 * 1000);
  const matchs = await prisma.match.findMany({
    where: { kickoff: { gte: maintenant, lte: dans36h }, remindedAt: null },
    include: { team: { select: { name: true } } },
  });
  let notifies = 0;
  for (const m of matchs) {
    const cibles = await destinatairesMatch(m.teamId);
    if (cibles.length > 0) {
      const lieu = m.home ? "à domicile" : `à ${m.opponent}`;
      const { envoyees } = await envoyerNotification(cibles, {
        title: `Demain : ${m.team.name}`,
        body: `${m.home ? "USAP" : m.opponent} contre ${m.home ? m.opponent : "USAP"} · ${formatTime(m.kickoff)} ${lieu} · ${COMPETITION_LABEL[m.competition]}`,
        url: "/matchs",
      });
      notifies += envoyees;
    }
    await prisma.match.update({ where: { id: m.id }, data: { remindedAt: new Date() } });
  }
  return NextResponse.json({ matchs: matchs.length, notifications: notifies, ics, icsErreur });
}
