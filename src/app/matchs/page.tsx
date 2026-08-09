import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import SportCoricoCard from "@/components/SportCoricoCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matchs" };

export default async function MatchsPage({
  searchParams,
}: {
  searchParams: { equipe?: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });
  const active = searchParams.equipe;
  const where = active ? { team: { slug: active } } : {};
  const now = new Date();

  const [aVenir, joues] = await Promise.all([
    prisma.match.findMany({
      where: { ...where, kickoff: { gte: now } },
      orderBy: { kickoff: "asc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: { ...where, kickoff: { lt: now } },
      orderBy: { kickoff: "desc" },
      take: 12,
      include: { team: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Calendrier</p>
      <h1 className="title mt-3">Les matchs</h1>

      {/* Filtre par categorie */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/matchs"
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
            !active
              ? "border-jaune bg-jaune text-noir"
              : "border-white/15 text-cream/70 hover:border-jaune hover:text-jaune"
          }`}
        >
          Toutes
        </a>
        {teams.map((t) => (
          <a
            key={t.id}
            href={`/matchs?equipe=${t.slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              active === t.slug
                ? "border-jaune bg-jaune text-noir"
                : "border-white/15 text-cream/70 hover:border-jaune hover:text-jaune"
            }`}
          >
            {t.name}
          </a>
        ))}
      </div>

      <div className="mt-8">
        <SportCoricoCard variant="inline" />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-black uppercase">À venir</h2>
        {aVenir.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun match programmé.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aVenir.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-black uppercase">Déjà joués</h2>
        {joues.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun match joué pour l'instant.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joues.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
