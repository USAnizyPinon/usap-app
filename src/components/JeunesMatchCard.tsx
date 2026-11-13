import type { Competition } from "@prisma/client";
import { formatDate, formatTime } from "@/lib/format";
import type { Plateau } from "@/lib/sportcorico-plateaux";
import { bilanUsap } from "@/lib/sportcorico-plateaux";

type Carte = { kickoff: Date; opponent: string; venue: string | null; competition: Competition; team: { name: string; slug?: string } };

export default function JeunesMatchCard({ match, details, plateau }: {
  match: Carte;
  details?: { participants: string[]; sourceUrl: string | null };
  plateau?: Plateau;
}) {
  const participants = details?.participants ?? [];
  const slug = match.team.slug ?? "";
  const equipes = plateau?.equipes ?? [];
  const parId = new Map(equipes.map(e => [e.id, e]));
  const bilans = plateau ? bilanUsap(plateau, slug) : [];
  return (
    <article className="overflow-hidden rounded-2xl border border-white/15 bg-noir-2 shadow-card">
      <div className="h-1 bg-jaune" />
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <span className="text-sm font-black uppercase tracking-wide text-jaune">{match.team.name}</span>
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cream/80">{match.competition === "CHAMPIONNAT" ? "Championnat" : "Plateau"}</span>
      </div>
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">{formatDate(match.kickoff)}</p>
        <p className="mt-2 font-display text-4xl font-black tracking-tight text-white">{formatTime(match.kickoff)}</p>
        <h3 className="mt-4 text-base font-bold leading-snug text-cream">{plateau?.titre ?? match.opponent}</h3>
        <p className="mt-3 text-xs leading-relaxed text-cream/60">📍 {plateau?.lieu ?? match.venue ?? "Lieu à confirmer"}</p>
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/60">Clubs participants</p>
        {equipes.length ? (
          <ul className="space-y-2">{equipes.map(e => <li key={e.id} className="flex items-center gap-2 text-xs font-semibold text-cream">
            {e.logo ? <img src={e.logo} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-contain" /> : <span className="h-7 w-7 rounded-full bg-white/10" />}
            <span>{e.nom}</span>
          </li>)}</ul>
        ) : participants.length ? <ul className="flex flex-wrap gap-2">{participants.map(c => <li key={c} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs">{c}</li>)}</ul>
          : <p className="text-xs text-cream/45">Liste non transmise par le calendrier SportCorico.</p>}
        {plateau && <>
          <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-cream/60">Rencontres et résultats</p>
          <div className="space-y-2">{plateau.rencontres.map(r => {
            const domicile = parId.get(r.domicile), exterieur = parId.get(r.exterieur);
            if (!domicile || !exterieur) return null;
            return <div key={r.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-white/5 px-2 py-2 text-xs">
              <span className="text-right">{domicile.nom}</span>
              <strong className="whitespace-nowrap text-jaune">{r.butsDomicile === null || r.butsExterieur === null ? "– : –" : `${r.butsDomicile} – ${r.butsExterieur}`}</strong>
              <span>{exterieur.nom}</span>
            </div>;
          })}</div>
          {bilans.map(b => <div key={b.nom} className="mt-4 rounded-lg border border-jaune/30 bg-jaune/5 p-3">
            <p className="mb-2 text-xs font-bold text-jaune">{b.nom} · Bilan</p>
            <div className="grid grid-cols-3 gap-2 text-center text-sm font-black">
              <span>{b.victoires} <small className="text-xs font-normal">V</small></span>
              <span>{b.nuls} <small className="text-xs font-normal">N</small></span>
              <span>{b.defaites} <small className="text-xs font-normal">D</small></span>
            </div>
          </div>)}
          <p className="mt-3 text-[10px] text-cream/40">Dernière récupération : {new Date(plateau.misAJour).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
        </>}
        {details?.sourceUrl && <a className="mt-3 inline-block text-xs font-bold text-jaune hover:underline" target="_blank" rel="noreferrer" href={details.sourceUrl}>Voir sur SportCorico ↗</a>}
      </div>
    </article>
  );
}
