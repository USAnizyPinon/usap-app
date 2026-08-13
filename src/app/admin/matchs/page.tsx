import { prisma } from "@/lib/prisma";
import { COMPETITION_LABEL, formatDateTime, resultOf } from "@/lib/format";
import MatchForm from "./MatchForm";
import ImportFootclubs from "./ImportFootclubs";
import ViderCalendrier from "./ViderCalendrier";
import ScoreForm from "./ScoreForm";
import SportCoricoCard from "@/components/SportCoricoCard";
import Link from "next/link";
import { supprimerMatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMatchsPage() {
  const now = new Date();
  const [teams, aVenir, joues] = await Promise.all([
    prisma.team.findMany({ orderBy: { order: "asc" } }),
    prisma.match.findMany({
      where: { kickoff: { gte: now } },
      orderBy: { kickoff: "asc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: { kickoff: { lt: now } },
      orderBy: { kickoff: "desc" },
      take: 15,
      include: { team: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-12">
      <SportCoricoCard variant="inline" />

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Importer le calendrier
        </h2>
        <p className="mt-1 text-xs text-cream/50">
          Toute la saison d&apos;un coup, depuis une extraction Footclubs.
        </p>
        <ImportFootclubs teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
        <ViderCalendrier teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">Ajouter un match</h2>
        <MatchForm teams={teams} />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Calendrier à venir <span className="text-sm text-cream/40">({aVenir.length})</span>
        </h2>

        {aVenir.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun match programmé.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {aVenir.map((m) => (
              <li key={m.id} className="card flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-black uppercase">{m.team.name}</p>
                  <p className="mt-1 text-sm text-cream/75">
                    {m.home ? "Reçoit" : "Se déplace à"} {m.opponent}
                  </p>
                  <p className="mt-1 text-xs capitalize text-cream/45">
                    {formatDateTime(m.kickoff)} · {COMPETITION_LABEL[m.competition]}
                    {m.venue ? ` · ${m.venue}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/matchs/${m.id}`}
                    className="text-xs font-bold text-jaune hover:underline"
                  >
                    Modifier
                  </Link>
                  <form action={supprimerMatch}>
                    <input type="hidden" name="matchId" value={m.id} />
                    <button className="text-xs font-bold text-red-300 hover:text-red-200">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">Résultats</h2>
        <p className="mt-1 text-xs text-cream/50">
          Le score se saisit du point de vue de l&apos;USAP. Le direct reste sur SportCorico.
        </p>

        {joues.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun match joué.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {joues.map((m) => (
              <li key={m.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {m.team.name} — {m.home ? "vs" : "chez"} {m.opponent}
                  </p>
                  <p className="mt-1 text-xs capitalize text-cream/45">
                    {formatDateTime(m.kickoff)}
                  </p>
                  {resultOf(m) && (
                    <p className="mt-1 text-xs font-bold text-jaune">
                      {m.scoreFor} – {m.scoreAgainst}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <ScoreForm
                    matchId={m.id}
                    scoreFor={m.scoreFor}
                    scoreAgainst={m.scoreAgainst}
                    scorers={m.scorers}
                  />
                  <Link
                    href={`/admin/matchs/${m.id}`}
                    className="pb-2 text-xs font-bold text-jaune hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
