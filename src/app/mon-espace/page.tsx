import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, canEdit } from "@/lib/auth";
import SportCoricoCard from "@/components/SportCoricoCard";
import PreferencesForm from "./PreferencesForm";
import NotificationsCard from "@/components/NotificationsCard";
import MatchCard from "@/components/MatchCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte" };

const ROLE_LABEL: Record<string, string> = {
  LICENCIE: "Licencié",
  DIRIGEANT: "Dirigeant",
  ADMIN: "Administrateur",
};

export default async function MonEspacePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const [me, teams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { favorites: { select: { id: true } } },
    }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  const favoris = me?.favorites.map((f) => f.id) ?? [];

  // Les prochains matchs des categories suivies
  const prochains =
    favoris.length > 0
      ? await prisma.match.findMany({
          where: { teamId: { in: favoris }, kickoff: { gte: new Date() } },
          orderBy: { kickoff: "asc" },
          take: 3,
          include: { team: { select: { name: true } } },
        })
      : [];

  const editor = canEdit(session.user.role);

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Mon compte</p>
      <h1 className="title mt-3">
        Bonjour {session.user.name?.split(" ")[0] ?? ""}
      </h1>

      {/* Carte d'identite du compte */}
      <div className="card mt-6 flex flex-wrap items-center gap-4">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate font-bold">{session.user.name}</p>
          <p className="truncate text-xs text-cream/50">{session.user.email}</p>
        </div>
        <span className="ml-auto rounded-full bg-jaune/15 px-3 py-1 text-xs font-bold text-jaune">
          {ROLE_LABEL[session.user.role] ?? "Licencié"}
        </span>
      </div>

      {/* Mes prochains matchs */}
      {prochains.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-black uppercase">
            Mes prochains matchs
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prochains.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Notifications */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-black uppercase">Notifications</h2>
        <div className="mt-4">
          <NotificationsCard />
        </div>
      </section>

      {/* Categories suivies */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-black uppercase">
          Les catégories que je suis
        </h2>
        <p className="mt-1 text-sm text-cream/55">
          Vous serez prévenu des matchs des catégories cochées.
        </p>
        <PreferencesForm
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          favoris={favoris}
          notifyMatches={me?.notifyMatches ?? true}
          notifyNews={me?.notifyNews ?? true}
        />
      </section>

      {/* SportCorico */}
      <section className="mt-10">
        <SportCoricoCard />
      </section>

      {editor && (
        <section className="mt-10">
          <div className="card">
            <p className="eyebrow">Gestion</p>
            <h2 className="mt-3 font-display text-2xl font-black uppercase">
              Espace dirigeant
            </h2>
            <p className="mt-3 text-sm text-cream/70">
              Calendrier, effectifs et actualités du club.
            </p>
            <Link href="/admin" className="btn-jaune mt-5">
              Ouvrir la gestion
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
