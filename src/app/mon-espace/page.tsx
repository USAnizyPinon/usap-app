import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, canEdit } from "@/lib/auth";
import SportCoricoCard from "@/components/SportCoricoCard";
import PreferencesForm from "./PreferencesForm";
import NotificationsCard from "@/components/NotificationsCard";
import MatchCard from "@/components/MatchCard";
import { bornesWeekend, weekendEnCours } from "@/lib/weekend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace" };

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
      include: { favorites: { select: { id: true, name: true } } },
    }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  const favoris = me?.favorites.map((f) => f.id) ?? [];
  const editor = canEdit(session.user.role);

  // Le week-end qui arrive, limité aux catégories suivies
  const { debut, fin } = bornesWeekend();
  const weekend =
    favoris.length > 0
      ? await prisma.match.findMany({
          where: { teamId: { in: favoris }, kickoff: { gte: debut, lte: fin } },
          orderBy: { kickoff: "asc" },
          include: { team: { select: { name: true } } },
        })
      : [];

  // Rien ce week-end : on montre ce qui vient ensuite
  const prochains =
    favoris.length > 0 && weekend.length === 0
      ? await prisma.match.findMany({
          where: { teamId: { in: favoris }, kickoff: { gt: fin } },
          orderBy: { kickoff: "asc" },
          take: 3,
          include: { team: { select: { name: true } } },
        })
      : [];

  const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

  return (
    <div className="wrap py-12">
      {/* ---------- Identité ---------- */}
      <section>
        <p className="eyebrow">Mon espace</p>
        <h1 className="title mt-3">
          Bonjour {session.user.name?.split(" ")[0] ?? ""}
        </h1>

        <div className="card mt-6 flex flex-wrap items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-jaune font-display text-xl font-black text-noir">
              {session.user.name?.charAt(0) ?? "?"}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate font-display text-lg font-black uppercase">
              {session.user.name}
            </p>
            <p className="truncate text-xs text-cream/50">{session.user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-jaune/15 px-3 py-1 text-[11px] font-bold text-jaune">
                {ROLE_LABEL[session.user.role] ?? "Licencié"}
              </span>
              {favoris.length > 0 && (
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-cream/60">
                  {favoris.length} catégorie{favoris.length > 1 ? "s" : ""} suivie
                  {favoris.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {editor && (
            <Link href="/admin" className="btn-jaune ml-auto !py-2 text-xs">
              Espace dirigeant
            </Link>
          )}
        </div>
      </section>

      {/* ---------- Mon week-end ---------- */}
      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-black uppercase">
            {weekend.length > 0 ? "Mon week-end" : "Mes prochains matchs"}
          </h2>
          {weekend.length > 0 && (
            <p className="text-sm text-cream/50">
              {weekendEnCours() ? "Ce" : "Le"} week-end du {jour.format(debut)} au{" "}
              {jour.format(fin)}
            </p>
          )}
        </div>

        {favoris.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">
            Choisissez vos catégories plus bas : vos matchs s&apos;afficheront ici.
          </p>
        ) : weekend.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-cream/60">
              {weekend.length} match{weekend.length > 1 ? "s" : ""} dans
              {weekend.length > 1 ? " vos catégories" : " votre catégorie"}.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weekend.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </>
        ) : prochains.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-cream/60">
              Rien ce week-end. Voici ce qui arrive ensuite.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prochains.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </>
        ) : (
          <p className="card mt-4 text-sm text-cream/60">
            Aucun match programmé dans vos catégories pour le moment.
          </p>
        )}
      </section>

      {/* ---------- Notifications ---------- */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-black uppercase">Mes notifications</h2>
        <p className="mt-1 text-sm text-cream/55">
          Recevez les matchs, résultats et actualités qui vous concernent.
        </p>
        <div className="mt-4">
          <NotificationsCard />
        </div>
      </section>

      {/* ---------- Catégories suivies ---------- */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-black uppercase">
          Les catégories que je suis
        </h2>
        <p className="mt-1 text-sm text-cream/55">
          Cochez les équipes dont vous voulez suivre l&apos;actualité et les matchs.
        </p>
        <PreferencesForm
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          favoris={favoris}
          reglages={{
            notifyMatches: me?.notifyMatches ?? true,
            notifyResults: me?.notifyResults ?? true,
            notifyNews: me?.notifyNews ?? true,
            notifyEvents: me?.notifyEvents ?? true,
          }}
        />
      </section>

      {/* ---------- SportCorico ---------- */}
      <section className="mt-12">
        <SportCoricoCard />
      </section>
    </div>
  );
}
