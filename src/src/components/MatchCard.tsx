import {
  COMPETITION_LABEL,
  formatDate,
  formatTime,
  resultClasses,
  resultOf,
} from "@/lib/format";
import Crest from "./Crest";
import type { Competition } from "@prisma/client";

export type MatchLike = {
  id: string;
  kickoff: Date;
  opponent: string;
  opponentLogo?: string | null;
  home: boolean;
  competition: Competition;
  venue: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  team: { name: string };
};

/**
 * Carte de match presentee comme une affiche : les deux ecussons
 * se font face, le score ou l'heure au centre.
 */
export default function MatchCard({ match }: { match: MatchLike }) {
  const result = resultOf(match);
  const joue = result !== null;

  // A domicile, l'USAP est a gauche ; a l'exterieur, elle est a droite.
  const gauche = match.home
    ? { nom: "USAP", usap: true, logo: null }
    : { nom: match.opponent, usap: false, logo: match.opponentLogo };
  const droite = match.home
    ? { nom: match.opponent, usap: false, logo: match.opponentLogo }
    : { nom: "USAP", usap: true, logo: null };

  const scoreG = match.home ? match.scoreFor : match.scoreAgainst;
  const scoreD = match.home ? match.scoreAgainst : match.scoreFor;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-noir-2 shadow-card transition hover:border-jaune/40">
      {/* Bandeau : categorie + competition */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h3 className="truncate font-display text-sm font-black uppercase tracking-wide">
          {match.team.name}
        </h3>
        <span className="shrink-0 rounded-full border border-jaune/40 bg-jaune/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-jaune">
          {COMPETITION_LABEL[match.competition]}
        </span>
      </div>

      {/* L'affiche : ecusson · score/heure · ecusson */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={gauche.nom} logo={gauche.logo} usap={gauche.usap} />
          <span className="line-clamp-2 text-xs font-bold leading-tight text-cream/85">
            {gauche.nom}
          </span>
        </div>

        <div className="px-1 text-center">
          {joue ? (
            <span className="font-display text-3xl font-black leading-none text-jaune">
              {scoreG}
              <span className="mx-1 text-cream/30">–</span>
              {scoreD}
            </span>
          ) : (
            <>
              <span className="block font-display text-xl font-black leading-none text-jaune">
                {formatTime(match.kickoff)}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-cream/40">
                coup d&apos;envoi
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={droite.nom} logo={droite.logo} usap={droite.usap} />
          <span className="line-clamp-2 text-xs font-bold leading-tight text-cream/85">
            {droite.nom}
          </span>
        </div>
      </div>

      {/* Pied : date et lieu, ou verdict */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <p className="truncate text-[11px] capitalize text-cream/50">
          {formatDate(match.kickoff)}
          {match.venue ? ` · ${match.venue}` : match.home ? " · à domicile" : " · extérieur"}
        </p>
        {joue && (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${resultClasses(
              result
            )}`}
          >
            {result === "VICTOIRE" ? "Victoire" : result === "NUL" ? "Nul" : "Défaite"}
          </span>
        )}
      </div>
    </article>
  );
}
