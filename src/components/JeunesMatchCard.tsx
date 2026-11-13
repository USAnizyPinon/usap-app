import type { Competition } from "@prisma/client";
import { formatDate, formatTime } from "@/lib/format";

type Carte = {
  kickoff: Date;
  opponent: string;
  venue: string | null;
  competition: Competition;

  team: { name: string };
};

export default function JeunesMatchCard({ match, details }: { match: Carte; details?: { participants: string[]; sourceUrl: string | null } }) {
  const participants = details?.participants ?? [];
  const sourceUrl = details?.sourceUrl ?? null;
  const plateau = /plateau/i.test(match.opponent);
  return (
    <article className="overflow-hidden rounded-2xl border border-white/15 bg-noir-2 shadow-card">
      <div className="h-1 bg-jaune" />
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <span className="text-sm font-black uppercase tracking-wide text-jaune">{match.team.name}</span>
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cream/80">
          {match.competition === "CHAMPIONNAT" ? "Championnat" : plateau ? "Plateau" : "Rencontre"}
        </span>
      </div>
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">{formatDate(match.kickoff)}</p>
        <p className="mt-2 font-display text-4xl font-black tracking-tight text-white">{formatTime(match.kickoff)}</p>
        <h3 className="mt-4 text-base font-bold leading-snug text-cream">{match.opponent}</h3>
        <p className="mt-3 text-xs leading-relaxed text-cream/60">📍 {match.venue || "Lieu à confirmer"}</p>
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cream/60">Clubs participants</p>
        {participants.length ? (
          <ul className="flex flex-wrap gap-2">{participants.map((club) => <li key={club} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-cream">{club}</li>)}</ul>
        ) : (
          <p className="text-xs text-cream/45">Liste non transmise par le calendrier SportCorico.</p>
        )}
        {sourceUrl && <a className="mt-3 inline-block text-xs font-bold text-jaune hover:underline" target="_blank" rel="noreferrer" href={sourceUrl}>Voir les participants dans SportCorico ↗</a>}
      </div>
    </article>
  );
}
