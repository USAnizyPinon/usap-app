import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import InscriptionForm from "./InscriptionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Événements" };

export default async function EvenementsPage() {
  const session = await auth();

  const evenements = await prisma.event.findMany({
    where: { published: true, startsAt: { gte: new Date(Date.now() - 86400000) } },
    orderBy: { startsAt: "asc" },
    include: {
      registrations: {
        select: { userId: true, people: true, user: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="wrap py-12">
      <p className="eyebrow">La vie du club</p>
      <h1 className="title mt-3">Événements</h1>

      {evenements.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucun événement prévu pour l&apos;instant. Revenez bientôt.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {evenements.map((e) => {
            const inscrits = e.registrations.reduce((t, r) => t + r.people, 0);
            const moi = session
              ? e.registrations.find((r) => r.userId === session.user.id)
              : undefined;
            const complet = e.capacity ? inscrits >= e.capacity : false;

            return (
              <article key={e.id} className="card overflow-hidden">
                {e.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.image}
                    alt=""
                    loading="lazy"
                    className="-mx-5 -mt-5 mb-5 h-48 w-[calc(100%+2.5rem)] object-cover"
                  />
                )}

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-black uppercase leading-tight">
                      {e.title}
                    </h2>
                    <p className="mt-2 text-sm capitalize text-jaune">
                      {formatDateTime(e.startsAt)}
                    </p>
                    {e.place && (
                      <p className="mt-1 text-xs text-cream/50">{e.place}</p>
                    )}
                  </div>

                  {e.capacity && (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        complet
                          ? "border-red-400/30 bg-red-500/10 text-red-300"
                          : "border-white/20 text-cream/70"
                      }`}
                    >
                      {complet ? "Complet" : `${inscrits} / ${e.capacity} places`}
                    </span>
                  )}
                  {!e.capacity && inscrits > 0 && (
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-cream/70">
                      {inscrits} inscrit{inscrits > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {e.description && (
                  <p className="mt-4 whitespace-pre-line text-sm text-cream/70">
                    {e.description}
                  </p>
                )}

                <div className="mt-5 border-t border-white/10 pt-5">
                  {!e.openToSignup ? (
                    <p className="text-sm text-cream/55">Les inscriptions sont fermées.</p>
                  ) : !session ? (
                    <p className="text-sm text-cream/55">
                      Connectez-vous pour vous inscrire.
                    </p>
                  ) : (
                    <InscriptionForm
                      eventId={e.id}
                      dejaInscrit={moi ? moi.people : null}
                      complet={complet && !moi}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
