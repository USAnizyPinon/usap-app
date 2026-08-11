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
  const semaine = 7 * 24 * 60 * 60 * 1000;
  const dansUneSemaine = new Date(now.getTime() + semaine);
  const ilYaUneSemaine = new Date(now.getTime() - semaine);

  const [prochains, derniers, actus, nbJoueurs, nbEquipes, evenements, partenaires, photos] =
    await Promise.all([
    prisma.match.findMany({
      where: { kickoff: { gte: now, lte: dansUneSemaine } },
      orderBy: { kickoff: "asc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: { kickoff: { gte: ilYaUneSemaine, lt: now } },
      orderBy: { kickoff: "desc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.player.count(),
    prisma.team.count(),
    prisma.event.findMany({
      where: { published: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.partner.findMany({
      where: { visible: true, logo: { not: null } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: 8,
    }),
    prisma.photo.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  // Hors période de match (été, trêve), la semaine est vide :
  // on annonce alors les toutes prochaines rencontres, en le disant clairement.
  const horsSemaine =
    prochains.length === 0
      ? await prisma.match.findMany({
          where: { kickoff: { gt: dansUneSemaine } },
          orderBy: { kickoff: "asc" },
          take: 2,
          include: { team: { select: { name: true } } },
        })
      : [];
  const semaineChargee = prochains.length > 0;
  const listeAVenir = semaineChargee ? prochains : horsSemaine;

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="stripes relative overflow-hidden border-b border-white/10">
        {/* L'ecusson en filigrane : discret, il tient tout le hero */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/2 hidden w-[420px] -translate-y-1/2 opacity-[.07] md:block"
        />

        <div className="wrap relative py-16 sm:py-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="US Anizy Pinon"
            className="mb-6 h-24 w-auto animate-rise drop-shadow-[0_10px_30px_rgba(0,0,0,.6)] sm:h-28"
          />
          <p className="eyebrow animate-rise">Application officielle du club</p>

          {/* Le nom exact du club : identique a celui declare pour la connexion Google */}
          <h1 className="title mt-4 animate-rise text-4xl sm:text-6xl">
            US Anizy <span className="text-jaune">Pinon</span>
          </h1>
          <p className="mt-3 animate-rise font-display text-xl font-black uppercase text-cream/60 sm:text-2xl">
            Le club dans votre poche
          </p>

          <p className="mt-5 max-w-2xl animate-rise text-cream/70">
            L&apos;application de l&apos;US Anizy Pinon, club de football amateur des
            communes d&apos;Anizy-le-Grand et de Pinon. Consultez le calendrier des matchs
            de toutes les catégories, les résultats, le classement, les effectifs, les
            actualités et les événements du club.
          </p>
          <p className="mt-3 max-w-2xl animate-rise text-sm text-cream/50">
            La connexion avec Google est facultative : elle sert à recevoir les
            notifications des catégories que vous suivez, à vous inscrire aux événements
            et, pour les dirigeants, à mettre à jour le contenu du club.
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
              { k: listeAVenir.length, l: "matchs à venir" },
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
            <p className="eyebrow">
              {semaineChargee ? "Cette semaine" : "Prochainement"}
            </p>
            <h2 className="title mt-3">
              {semaineChargee ? "Les matchs de la semaine" : "La reprise approche"}
            </h2>
            {!semaineChargee && listeAVenir.length > 0 && (
              <p className="mt-2 text-sm text-cream/55">
                Aucun match cette semaine. Voici les prochaines rencontres.
              </p>
            )}
          </div>
          <Link href="/matchs" className="hidden text-sm font-bold text-jaune sm:block">
            Tout voir →
          </Link>
        </div>

        {listeAVenir.length === 0 ? (
          <p className="card mt-6 text-sm text-cream/60">
            Aucun match programmé pour le moment. Les dirigeants ajoutent les rencontres
            depuis l&apos;espace admin.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listeAVenir.map((m) => (
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
          <p className="eyebrow">La semaine dernière</p>
          <h2 className="title mt-3">Derniers résultats</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {derniers.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- EVENEMENTS ---------------- */}
      {evenements.length > 0 && (
        <section className="wrap pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">À ne pas manquer</p>
              <h2 className="title mt-3">Prochains événements</h2>
            </div>
            <Link href="/evenements" className="hidden text-sm font-bold text-jaune sm:block">
              Tout voir →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {evenements.map((e) => (
              <Link
                key={e.id}
                href="/evenements"
                className="card group overflow-hidden transition hover:border-jaune/50"
              >
                {e.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={e.image}
                    alt=""
                    loading="lazy"
                    className="-mx-5 -mt-5 mb-4 aspect-video w-[calc(100%+2.5rem)] object-cover"
                  />
                )}
                <p className="font-display text-lg font-black uppercase leading-tight group-hover:text-jaune">
                  {e.title}
                </p>
                <p className="mt-2 text-sm capitalize text-jaune">
                  {formatDate(e.startsAt)}
                </p>
                {e.place && <p className="mt-1 text-xs text-cream/50">{e.place}</p>}
                {e.openToSignup && (
                  <p className="mt-3 text-xs font-bold text-cream/70">
                    Inscriptions ouvertes →
                  </p>
                )}
              </Link>
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
      {/* ---------------- GALERIE ---------------- */}
      {photos.length > 0 && (
        <section className="wrap pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">En images</p>
              <h2 className="title mt-3">La galerie</h2>
            </div>
            <Link href="/galerie" className="hidden text-sm font-bold text-jaune sm:block">
              Tout voir →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {photos.map((p) => (
              <Link
                key={p.id}
                href="/galerie"
                className="group overflow-hidden rounded-xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption ?? ""}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- PARTENAIRES ---------------- */}
      {partenaires.length > 0 && (
        <section className="border-t border-white/10 bg-noir-2 py-12">
          <div className="wrap">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Ils font vivre le club</p>
                <h2 className="mt-3 font-display text-2xl font-black uppercase">
                  Nos partenaires
                </h2>
              </div>
              <Link
                href="/partenaires"
                className="hidden text-sm font-bold text-jaune sm:block"
              >
                Tout voir →
              </Link>
            </div>

            {/* Fond blanc : sans lui, les logos sombres disparaissent */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {partenaires.map((p) => (
                <div
                  key={p.id}
                  title={p.name}
                  className="grid h-20 w-32 place-items-center rounded-xl bg-white/95 p-3 transition hover:bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo as string}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}