import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { dernierPassage } from "@/lib/sportcorico-sync";
import SyncPanel from "./SyncPanel";
import JeunesICSPanel from "./JeunesICSPanel";

export const dynamic = "force-dynamic";

export default async function AdminSportCoricoPage() {
  const [equipes, dernier, verrouilles] = await Promise.all([
    prisma.team.findMany({ orderBy: { order: "asc" } }),
    dernierPassage(),
    prisma.match.count({ where: { scoreLocked: true } }),
  ]);
  const branchees = equipes.filter((e) => e.sportcoricoUrl);
  return <div className="space-y-8">
    <div className="card">
      <h2 className="font-display text-xl font-black uppercase">Calendrier et scores repris sur SportCorico</h2>
      <p className="mt-2 text-sm text-cream/70">Les pages publiques SportCorico alimentent les calendriers et scores des équipes à 11. Le calendrier privé ICS complète les plateaux des jeunes.</p>
      <ul className="mt-4 space-y-1.5 text-sm text-cream/60">
        <li>• Les nouvelles rencontres identifiées sont ajoutées.</li>
        <li>• Un changement d'horaire est répercuté.</li>
        <li>• Les scores saisis à la main ne sont pas écrasés.</li>
        <li>• Les réunions privées et matchs sans catégorie identifiable ne sont pas publiés.</li>
      </ul>
      <p className="mt-4 text-xs text-cream/45">Dernier passage public : {dernier ? <span className="capitalize text-cream/70">{formatDateTime(dernier)}</span> : "jamais"}{verrouilles > 0 && ` · ${verrouilles} score(s) verrouillé(s)`}</p>
    </div>
    <section>
      <h3 className="font-display text-lg font-black uppercase">Équipes avec une page publique SportCorico</h3>
      {branchees.length === 0 ? <div className="card mt-4"><p className="text-sm text-cream/70">Aucune catégorie reliée. Voir <Link href="/admin/equipes" className="text-jaune">Créneaux</Link>.</p></div> :
        <ul className="mt-4 space-y-2">{branchees.map(e => <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3"><span className="font-bold">{e.name}</span><a href={e.sportcoricoUrl!} target="_blank" rel="noreferrer" className="max-w-full truncate text-xs text-cream/50 hover:text-jaune">{e.sportcoricoUrl}</a></li>)}</ul>}
    </section>
    <SyncPanel actif={branchees.length > 0} />
    <JeunesICSPanel />
  </div>;
}
