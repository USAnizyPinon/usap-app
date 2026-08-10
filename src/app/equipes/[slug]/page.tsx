import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import PersonCard from "@/components/PersonCard";

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
                name={`${p.firstName} ${p.lastName}`.trim()}
                role={p.position ?? undefined}
                photo={p.photo}
                number={p.number}
              />
            ))}
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
