import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import JeunesMatchCard from "@/components/JeunesMatchCard";
import SportCoricoCard from "@/components/SportCoricoCard";
import SyncScores from "@/components/SyncScores";
import { chargerCalendrierICS } from "@/lib/sportcorico-ics";

export const revalidate = 120;
export const metadata = { title: "Matchs" };
const CATEGORIES_JEUNES = new Set(["U6 · U7", "U8 · U9", "U10 · U11", "Pôle Féminin Jeune"]);

export default async function MatchsPage({ searchParams }: { searchParams: { equipe?: string } }) {
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });
  const active = searchParams.equipe;
  const where = active ? { team: { slug: active } } : {};
  const now = new Date();
  const [aVenir, joues] = await Promise.all([
    prisma.match.findMany({ where: { ...where, kickoff: { gte: now } }, orderBy: { kickoff: "asc" }, include: { team: { select: { name: true } } } }),
    prisma.match.findMany({ where: { ...where, kickoff: { lt: now } }, orderBy: { kickoff: "desc" }, take: 12, include: { team: { select: { name: true } } } }),
  ]);
  // L'ICS reste confidentiel : lecture uniquement sur le serveur, jamais d'URL secrète dans la page.
  const ics = await chargerCalendrierICS().catch(() => null);
  const detailsParId = new Map((ics ?? []).map(ev => [`ics:${ev.uid}`, {
    participants: ev.participants, sourceUrl: ev.sourceUrl,
  }]));
  function Carte({ match }: { match: (typeof aVenir)[number] }) {
    return CATEGORIES_JEUNES.has(match.team.name) && match.scoreFor === null && match.scoreAgainst === null
      ? <JeunesMatchCard match={match} details={detailsParId.get(match.sportcoricoId ?? "")} /> : <MatchCard match={match} />;
  }
  return <div className="wrap py-12">
    <SyncScores />
    <p className="eyebrow">Calendrier</p>
    <h1 className="title mt-3">Les matchs</h1>
    <div className="mt-6 flex flex-wrap gap-2">
      <a href="/matchs" className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${!active ? "border-jaune bg-jaune text-noir" : "border-white/15 text-cream/70 hover:border-jaune hover:text-jaune"}`}>Toutes</a>
      {teams.map(t => <a key={t.id} href={`/matchs?equipe=${t.slug}`} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${active === t.slug ? "border-jaune bg-jaune text-noir" : "border-white/15 text-cream/70 hover:border-jaune hover:text-jaune"}`}>{t.name}</a>)}
    </div>
    <div className="mt-8"><SportCoricoCard variant="inline" /></div>
    <section className="mt-10">
      <h2 className="font-display text-xl font-black uppercase">À venir</h2>
      {aVenir.length === 0 ? <p className="card mt-4 text-sm text-cream/60">Aucun match programmé.</p> :
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{aVenir.map(m => <Carte key={m.id} match={m} />)}</div>}
    </section>
    <section className="mt-12">
      <h2 className="font-display text-xl font-black uppercase">Déjà joués</h2>
      {joues.length === 0 ? <p className="card mt-4 text-sm text-cream/60">Aucun match joué pour l'instant.</p> :
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{joues.map(m => <Carte key={m.id} match={m} />)}</div>}
    </section>
  </div>;
}
