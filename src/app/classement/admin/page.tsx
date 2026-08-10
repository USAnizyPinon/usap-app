import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import SportCoricoCard from "@/components/SportCoricoCard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const now = new Date();
  const [nbMatchs, nbJoueurs, nbActus, aVenir, sansResultat] = await Promise.all([
    prisma.match.count(),
    prisma.player.count(),
    prisma.news.count(),
    prisma.match.findMany({
      where: { kickoff: { gte: now } },
      orderBy: { kickoff: "asc" },
      take: 5,
      include: { team: { select: { name: true } } },
    }),
    prisma.match.count({ where: { kickoff: { lt: now }, scoreFor: null } }),
  ]);

  const demandesEnAttente = await prisma.joinRequest.count({
    where: { status: "EN_ATTENTE" },
  });

  return (
    <div className="space-y-10">
      <SportCoricoCard variant="inline" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: nbMatchs, l: "matchs enregistrés", href: "/admin/matchs" },
          { k: nbJoueurs, l: "joueurs à l'effectif", href: "/admin/effectif" },
          { k: nbActus, l: "actualités", href: "/admin/actus" },
          { k: sansResultat, l: "scores à saisir", href: "/admin/matchs" },
        ].map((s) => (
          <Link key={s.l} href={s.href} className="card transition hover:border-jaune/50">
            <p className="font-display text-4xl font-black text-jaune">{s.k}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/55">{s.l}</p>
          </Link>
        ))}
      </div>

      {demandesEnAttente > 0 && (
        <div className="rounded-2xl border border-jaune/30 bg-jaune/10 p-5">
          <p className="font-bold text-jaune">
            {demandesEnAttente} demande{demandesEnAttente > 1 ? "s" : ""} pour rejoindre le
            club
          </p>
          <p className="mt-1 text-sm text-cream/70">
            Des licenciés attendent votre validation pour entrer dans l&apos;effectif.
          </p>
          <Link href="/admin/demandes" className="btn-jaune mt-4">
            Voir les demandes
          </Link>
        </div>
      )}

      {sansResultat > 0 && (
        <div className="rounded-2xl border border-jaune/30 bg-jaune/10 p-5">
          <p className="font-bold text-jaune">
            {sansResultat} match{sansResultat > 1 ? "s" : ""} joué
            {sansResultat > 1 ? "s" : ""} sans score
          </p>
          <p className="mt-1 text-sm text-cream/70">
            Saisissez les résultats pour qu&apos;ils apparaissent sur l&apos;accueil.
          </p>
          <Link href="/admin/matchs" className="btn-jaune mt-4">
            Saisir les scores
          </Link>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-black uppercase">Prochains matchs</h2>
        {aVenir.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun match programmé.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {aVenir.map((m) => (
              <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {m.team.name} — {m.home ? "reçoit" : "se déplace à"} {m.opponent}
                  </p>
                  <p className="mt-1 text-xs capitalize text-cream/50">
                    {formatDateTime(m.kickoff)}
                  </p>
                </div>
                <Link href="/admin/matchs" className="text-xs font-bold text-jaune">
                  Modifier →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
