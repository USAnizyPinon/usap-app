import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { destinatairesMatch, envoyerNotification } from "@/lib/push";
import { COMPETITION_LABEL, formatTime } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rappel de match, envoyé la veille.
 * Déclenché chaque jour par Vercel (voir vercel.json).
 * Seules les personnes qui suivent la catégorie sont prévenues.
 */
export async function GET(req: Request) {
  // Vercel signe ses appels : on refuse tout le reste.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const entete = req.headers.get("authorization");
    if (entete !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const maintenant = new Date();
  const dans36h = new Date(maintenant.getTime() + 36 * 60 * 60 * 1000);

  // Les matchs qui approchent et qui n'ont pas encore été rappelés
  const matchs = await prisma.match.findMany({
    where: {
      kickoff: { gte: maintenant, lte: dans36h },
      remindedAt: null,
    },
    include: { team: { select: { name: true } } },
  });

  let notifies = 0;

  for (const m of matchs) {
    const cibles = await destinatairesMatch(m.teamId);

    if (cibles.length > 0) {
      const lieu = m.home ? "à domicile" : `à ${m.opponent}`;
      const { envoyees } = await envoyerNotification(cibles, {
        title: `Demain : ${m.team.name}`,
        body: `${m.home ? "USAP" : m.opponent} contre ${
          m.home ? m.opponent : "USAP"
        } · ${formatTime(m.kickoff)} ${lieu} · ${COMPETITION_LABEL[m.competition]}`,
        url: "/matchs",
      });
      notifies += envoyees;
    }

    // On marque même sans destinataire, pour ne pas repasser dessus
    await prisma.match.update({
      where: { id: m.id },
      data: { remindedAt: new Date() },
    });
  }

  return NextResponse.json({
    matchs: matchs.length,
    notifications: notifies,
  });
}
