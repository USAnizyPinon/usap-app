import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import { formatDate } from "@/lib/format";
import SportCoricoCard from "@/components/SportCoricoCard";

// Page mise en cache : affichage instantane.
// Toute modification par un dirigeant rafraichit la page aussitot.
export const revalidate = 120;

export default async function HomePage() {
  const now = new Date();

  const [prochains, derniers, actus, nbJoueurs, nbEquipes] = await Promise.all([
    prisma.match.findMany({
      where: { kickoff: { gte: now } },
      orderBy: { kickoff: "asc" },
      take: 6,
      include: { team: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: { kickoff: { lt: now }, scoreFor: { not: null } },
      orderBy: { kickoff: "desc" },
      take: 3,
      include: { team: { select: { name: true } } },
    }),
    prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.player.count(),
    prisma.team.count(),
  ]);

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="stripes relative overflow-hidden border-b border-white/10">
        <div className="wrap py-16 sm:py-24">
          <p className="eyebrow animate-rise">Saison 2025 / 2026</p>
          <h1 className="title mt-4 animate-rise text-4xl sm:text-6xl">
            Le club
            <br />
            dans votre <span className="text-jaune">poche</span>
          </h1>
          <p className="mt-5 max-w-xl animate-rise text-cream/70">
            Les matchs de toutes les catégories, les effectifs et les actualités de
            l&apos;US Anizy-Pinon, mis à jour par les dirigeants du club.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/matchs" className="btn-jaune">
              Voir les matchs
            </Link>
            <Link href="/equipes" className="btn-ghost">
              Nos équipes
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { k: nbEquipes, l: "équipes engagées" },
              { k: nbJoueurs, l: "licenciés à l'effectif" },
              { k: prochains.length, l: "matchs à venir" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-3xl font-black text-jaune">{s.k}</dt>
                <dd className="text-xs uppercase tracking-wider text-cream/50">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- PROCHAINS MATCHS ---------------- */}
      <section className="wrap py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">À venir</p>
            <h2 className="title mt-3">Prochains matchs</h2>
          </div>
          <Link href="/matchs" className="hidden text-sm font-bold text-jaune sm:block">
            Tout voir →
          </Link>
        </div>

        {prochains.length === 0 ? (
          <p className="card mt-6 text-sm text-cream/60">
            Aucun match programmé pour le moment. Les dirigeants ajoutent les rencontres
            depuis l&apos;espace admin.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prochains.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------- SPORTCORICO ---------------- */}
      <section className="wrap pb-14">
        <SportCoricoCard variant="inline" />
      </section>

      {/* ---------------- DERNIERS RESULTATS ---------------- */}
      {derniers.length > 0 && (
        <section className="wrap pb-14">
          <p className="eyebrow">Le week-end dernier</p>
          <h2 className="title mt-3">Derniers résultats</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {derniers.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- ACTUS ---------------- */}
      {actus.length > 0 && (
        <section className="wrap pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Le club</p>
              <h2 className="title mt-3">Actualités</h2>
            </div>
            <Link href="/actus" className="hidden text-sm font-bold text-jaune sm:block">
              Tout voir →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {actus.map((a) => (
              <article key={a.id} className="card">
                <span className="rounded-full bg-jaune/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-jaune">
                  {a.tag}
                </span>
                <h3 className="mt-3 font-display text-lg font-black leading-tight">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-cream/65">{a.excerpt}</p>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-cream/40">
                  {formatDate(a.publishedAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
