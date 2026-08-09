import {
  COMPETITION_LABEL,
  formatDate,
  formatTime,
  resultClasses,
  resultOf,
} from "@/lib/format";
import type { Competition } from "@prisma/client";

export type MatchLike = {
  id: string;
  kickoff: Date;
  opponent: string;
  home: boolean;
  competition: Competition;
  venue: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  team: { name: string };
};

export default function MatchCard({ match }: { match: MatchLike }) {
  const result = resultOf(match);
  const played = result !== null;

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-black uppercase leading-tight">
            {match.team.name}
          </h3>
          <p className="mt-1 text-xs text-cream/50">
            {match.home ? "À domicile" : "À l'extérieur"}
            {match.venue ? ` · ${match.venue}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-jaune/40 bg-jaune/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-jaune">
          {COMPETITION_LABEL[match.competition]}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-noir-3 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wider text-cream/45">
          {played ? "Résultat" : "Prochain match"}
        </p>

        {played ? (
          <>
            <p className="mt-2 font-display text-4xl font-black text-jaune">
              {match.scoreFor} – {match.scoreAgainst}
            </p>
            <p className="mt-1 text-sm text-cream/75">
              {match.home ? "USAP" : match.opponent} contre{" "}
              {match.home ? match.opponent : "USAP"}
            </p>
            <span
              className={`mt-3 inline-block rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${resultClasses(
                result
              )}`}
            >
              {result === "VICTOIRE" ? "Victoire" : result === "NUL" ? "Match nul" : "Défaite"}
            </span>
          </>
        ) : (
          <>
            <p className="mt-2 font-display text-2xl font-black">
              {match.home ? "USAP" : match.opponent}
              <span className="mx-2 text-jaune">vs</span>
              {match.home ? match.opponent : "USAP"}
            </p>
            <p className="mt-2 text-sm capitalize text-cream/75">
              {formatDate(match.kickoff)}
            </p>
            <p className="font-display text-xl font-black text-jaune">
              {formatTime(match.kickoff)}
            </p>
          </>
        )}
      </div>
    </article>
  );
}
