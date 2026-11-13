import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import JeunesMatchCard from "@/components/JeunesMatchCard";
import SportCoricoCard from "@/components/SportCoricoCard";
import SyncScores from "@/components/SyncScores";
import { chargerCalendrierICS } from "@/lib/sportcorico-ics";
import { chargerPlateaux, type Plateau } from "@/lib/sportcorico-plateaux";
import { jourParis } from "@/lib/sportcorico-sync";

export const revalidate = 120;
export const metadata = { title: "Matchs" };
const CATEGORIES_JEUNES = new Set(["u6-u7", "u8-u9", "u10-u11", "u12-u13", "pole-feminin-jeune"]);

/** Un lien d'événement prouvé est prioritaire sur les rapprochements approximatifs. */
function idEvenement(sourceUrl: string | null): number | null {
  if (!sourceUrl) return null;
  try {
    const u = new URL(sourceUrl);
    if (u.hostname !== "app.sportcorico.com") return null;
    const correspondance = /\/(?:evenements?|events?)\/(\d+)(?:\/|$)/i.exec(u.pathname);
    return correspondance ? Number(correspondance[1]) : null;
  } catch { return null; }
}
function normaliser(s: string | null) {
  return (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/\b(STADE|MUNICIPAL|RUE|DE|DU|DES|LA|LE|LES|A|AU|CHEZ)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ").trim();
}
/** Evite d'afficher les résultats d'un autre plateau si plusieurs événements
 * identiques sont inscrits le même jour dans le calendrier. */
function choisirPlateau(plateaux: Plateau[], date: string, categorie: string, lieu: string | null,
  sourceUrl: string | null, nombreEvenementsCeJour: number): Plateau | undefined {
  const candidats = plateaux.filter(p => p.date === date && p.categories.includes(categorie));
  const eventId = idEvenement(sourceUrl);
  if (eventId !== null) {
    const lies = candidats.filter(p => p.eventId === eventId);
    if (lies.length === 1) return lies[0];
    // Une correspondance explicite absente ne doit pas être contredite par le lieu.
    if (candidats.some(p => p.eventId !== null)) return undefined;
  }
  if (nombreEvenementsCeJour !== 1 || candidats.length !== 1) return undefined;
  const candidat = candidats[0];
  if (!lieu || !candidat.lieu) return undefined;
  const a = normaliser(lieu), b = normaliser(candidat.lieu);
  return a && b && (a === b || a.includes(b) || b.includes(a)) ? candidat : undefined;
}

export default async function MatchsPage({ searchParams }: { searchParams: { equipe?: string } }) {
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });
  const active = searchParams.equipe;
  const where = active ? { team: { slug: active } } : {};
  const now = new Date();
  const [aVenir, joues, ics, plateaux] = await Promise.all([
    prisma.match.findMany({ where: { ...where, kickoff: { gte: now } }, orderBy: { kickoff: "asc" }, include: { team: { select: { name: true, slug: true } } } }),
    prisma.match.findMany({ where: { ...where, kickoff: { lt: now } }, orderBy: { kickoff: "desc" }, take: 12, include: { team: { select: { name: true, slug: true } } } }),
    chargerCalendrierICS().catch(() => null),
    chargerPlateaux().catch(() => []),
  ]);
  const detailsParId = new Map((ics ?? []).map(ev => [`ics:${ev.uid}`, { participants: ev.participants, sourceUrl: ev.sourceUrl }]));
  const parJourCategorie = new Map<string, number>();
  // On compte les événements affichés, et non les UID bruts : un plateau mixte
  // peut avoir deux événements ICS, mais une seule compétition SportCorico.
  for (const m of [...aVenir, ...joues]) {
    if (!CATEGORIES_JEUNES.has(m.team.slug) || !m.sportcoricoId?.startsWith("ics:")) continue;
    const cle = `${jourParis(m.kickoff)}:${m.team.slug}`;
    parJourCategorie.set(cle, (parJourCategorie.get(cle) ?? 0) + 1);
  }

  function Carte({ match }: { match: (typeof aVenir)[number] }) {
    if (CATEGORIES_JEUNES.has(match.team.slug) && match.sportcoricoId?.startsWith("ics:")) {
      const date = jourParis(match.kickoff);
      const detail = detailsParId.get(match.sportcoricoId);
      const plateau = choisirPlateau(plateaux, date, match.team.slug, match.venue,
        detail?.sourceUrl ?? null, parJourCategorie.get(`${date}:${match.team.slug}`) ?? 0);
      return <JeunesMatchCard match={match} details={detailsParId.get(match.sportcoricoId)} plateau={plateau} />;
    }
    return <MatchCard match={match} />;
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
    <section className="mt-10"><h2 className="font-display text-xl font-black uppercase">À venir</h2>
      {aVenir.length === 0 ? <p className="card mt-4 text-sm text-cream/60">Aucun match programmé.</p> :
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{aVenir.map(m => <Carte key={m.id} match={m} />)}</div>}
    </section>
    <section className="mt-12"><h2 className="font-display text-xl font-black uppercase">Déjà joués</h2>
      {joues.length === 0 ? <p className="card mt-4 text-sm text-cream/60">Aucun match joué pour l'instant.</p> :
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{joues.map(m => <Carte key={m.id} match={m} />)}</div>}
    </section>
  </div>;
}
