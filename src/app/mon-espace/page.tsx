import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, canEdit } from "@/lib/auth";
import SportCoricoCard from "@/components/SportCoricoCard";
import PreferencesForm from "./PreferencesForm";
import NotificationsCard from "@/components/NotificationsCard";
import MatchCard from "@/components/MatchCard";
import { bornesWeekend, weekendEnCours } from "@/lib/weekend";
import RejoindreForm from "./RejoindreForm";
import MaPhotoForm from "./MaPhotoForm";
import ReconnaissanceForm from "./ReconnaissanceForm";
import { chercherFiche } from "../admin/demandes-actions";

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

  const [me, teams, monJoueur, demande] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { favorites: { select: { id: true } } },
    }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
    prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { team: { select: { name: true } } },
    }),
    prisma.joinRequest.findUnique({
      where: { userId: session.user.id },
      include: { team: { select: { name: true } } },
    }),
  ]);

  const prenomGoogle = session.user.name?.split(" ")[0] ?? "";
  const nomGoogle = session.user.name?.split(" ").slice(1).join(" ") ?? "";

  // Si une fiche porte déjà ce nom, on propose de la relier plutôt que d'en créer une
  const fiches =
    !monJoueur && !demande ? await chercherFiche(prenomGoogle, nomGoogle) : [];

  const favoris = me?.favorites.map((f) => f.id) ?? [];

  // Le week-end qui arrive, pour les categories suivies
  const { debut, fin } = bornesWeekend();
  const weekend =
    favoris.length > 0
      ? await prisma.match.findMany({
          where: { teamId: { in: favoris }, kickoff: { gte: debut, lte: fin } },
          orderBy: { kickoff: "asc" },
          include: { team: { select: { name: true } } },
        })
      : [];

  // Si le week-end est vide, on montre quand meme ce qui vient ensuite
  const prochains =
    favoris.length > 0 && weekend.length === 0
      ? await prisma.match.findMany({
          where: { teamId: { in: favoris }, kickoff: { gt: fin } },
          orderBy: { kickoff: "asc" },
          take: 3,
          include: { team: { select: { name: true } } },
        })
      : [];

  const dateWeekend = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  });

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

      {/* Invitation : un compte tout neuf n'est rattaché à rien */}
      {!monJoueur && !demande && (
        <div className="mt-8 rounded-2xl border border-jaune/30 bg-jaune/10 p-5">
          <p className="font-bold text-jaune">Dernière étape : dites-nous qui vous êtes</p>
          <p className="mt-1 text-sm text-cream/75">
            Indiquez votre catégorie pour apparaître dans l&apos;effectif et recevoir les
            informations qui vous concernent. C&apos;est rapide, et un dirigeant valide
            ensuite.
          </p>
        </div>
      )}

      {/* Ma place au club */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-black uppercase">Ma place au club</h2>

        {monJoueur ? (
          <div className="card mt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {monJoueur.photo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={monJoueur.photo}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover object-top"
                  />
                )}
                <div>
                  <p className="font-bold">
                    {monJoueur.firstName} {monJoueur.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-cream/55">
                    Dans l&apos;effectif · {monJoueur.team.name}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                Validé
              </span>
            </div>

            {/* Seule la photo reste modifiable une fois à l'effectif */}
            <MaPhotoForm photo={monJoueur.photo} pendingPhoto={monJoueur.pendingPhoto} />
          </div>
        ) : me?.supporter && demande?.status === "ACCEPTEE" ? (
          <div className="card mt-4">
            <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Supporter du club
            </span>
            <p className="mt-3 text-sm text-cream/70">
              Merci de suivre l&apos;USAP&nbsp;! Choisissez vos catégories ci-dessous pour
              recevoir leurs matchs.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {fiches.length > 0 && <ReconnaissanceForm fiches={fiches} />}
            <RejoindreForm
              teams={teams.map((t) => ({ id: t.id, name: t.name }))}
              demande={demande}
              nomParDefaut={{ prenom: prenomGoogle, nom: nomGoogle }}
            />
          </div>
        )}
      </section>

      {/* Mon week-end */}
      {favoris.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-black uppercase">
              {weekend.length > 0 ? "Mon week-end" : "Mes prochains matchs"}
            </h2>
            {weekend.length > 0 && (
              <p className="text-sm text-cream/50">
                {weekendEnCours() ? "Ce" : "Le"} week-end du{" "}
                {dateWeekend.format(debut)} au {dateWeekend.format(fin)}
              </p>
            )}
          </div>

          {weekend.length > 0 ? (
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
          reglages={{
            notifyMatches: me?.notifyMatches ?? true,
            notifyResults: me?.notifyResults ?? true,
            notifyNews: me?.notifyNews ?? true,
            notifyEvents: me?.notifyEvents ?? true,
          }}
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
