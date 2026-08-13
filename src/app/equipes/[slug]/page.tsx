import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import PersonCard from "@/components/PersonCard";
import { nomPublic, photoPublique } from "@/lib/affichage";

// Page mise en cache : affichage instantane.
// Toute modification par un dirigeant rafraichit la page aussitot.
export const revalidate = 300;

export default async function EquipePage({ params }: { params: { slug: string } }) {
  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: {
      players: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      staff: true,
      matches: { orderBy: { kickoff: "asc" } },
    },
  });

  if (!team) notFound();

  const now = new Date();
  const aVenir = team.matches.filter((m) => m.kickoff >= now).slice(0, 3);

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Équipe</p>
      <h1 className="title mt-3 text-4xl sm:text-5xl">{team.name}</h1>
      <p className="mt-3 text-sm text-cream/55">
        {[team.level, team.venue].filter(Boolean).join(" · ")}
      </p>
      {team.description && (
        <p className="mt-5 max-w-2xl text-cream/70">{team.description}</p>
      )}

      {(team.trainDays || team.restartDate) && (
        <div className="card mt-8 max-w-2xl">
          <p className="eyebrow">Entraînements</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {team.trainDays && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-cream/45">
                  Quand
                </dt>
                <dd className="mt-1 font-semibold">
                  {team.trainDays}
                  {team.trainHours ? ` · ${team.trainHours}` : ""}
                </dd>
              </div>
            )}
            {team.venue && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-cream/45">Où</dt>
                <dd className="mt-1 font-semibold">{team.venue}</dd>
              </div>
            )}
            {team.birthYears && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-cream/45">
                  Années
                </dt>
                <dd className="mt-1 font-semibold">{team.birthYears}</dd>
              </div>
            )}
          </dl>
          <Link
            href="/nous-rejoindre"
            className="mt-4 inline-block text-sm font-bold text-jaune hover:underline"
          >
            Venir à l&apos;essai →
          </Link>
        </div>
      )}

      {team.staff.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-black uppercase">L'encadrement</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.staff.map((s) => (
              <PersonCard
                key={s.id}
                name={`${s.firstName} ${s.lastName}`.trim()}
                role={s.role}
                photo={s.photo}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-xl font-black uppercase">
          L'effectif{" "}
          <span className="text-sm font-bold text-cream/40">({team.players.length})</span>
        </h2>
        {team.players.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">
            L'effectif n'est pas encore renseigné.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {team.players.map((p) => (
              <PersonCard
                key={p.id}
                name={nomPublic(p)}
                role={p.position ?? undefined}
                photo={photoPublique(p)}
                number={p.number}
              />
            ))}

            {/* L'effectif se complète au fil des licences */}
            <figure className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-noir-2/50 p-4 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-white/20 text-lg text-cream/30">
                +
              </span>
              <figcaption className="mt-3">
                <p className="text-sm font-bold text-cream/60">Et d&apos;autres</p>
                <p className="mt-0.5 text-[11px] text-cream/40">
                  L&apos;effectif se complète
                </p>
              </figcaption>
            </figure>
          </div>
        )}
      </section>

      {aVenir.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-black uppercase">Prochains matchs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aVenir.map((m) => (
              <MatchCard key={m.id} match={{ ...m, team: { name: team.name } }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
