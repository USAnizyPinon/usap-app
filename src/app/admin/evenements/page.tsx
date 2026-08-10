import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import EventForm from "./EventForm";
import EditEventForm from "./EditEventForm";
import { supprimerEvenement } from "../actions-plus";

export const dynamic = "force-dynamic";

export default async function AdminEvenementsPage() {
  const evenements = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      registrations: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-black uppercase">Créer un événement</h2>
        <EventForm />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Les événements{" "}
          <span className="text-sm text-cream/40">({evenements.length})</span>
        </h2>

        {evenements.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun événement.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {evenements.map((e) => {
              const total = e.registrations.reduce((t, r) => t + r.people, 0);
              return (
                <li key={e.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-black uppercase">{e.title}</p>
                      <p className="mt-1 text-xs capitalize text-cream/50">
                        {formatDateTime(e.startsAt)}
                        {e.place ? ` · ${e.place}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-cream/70">
                      {total} inscrit{total > 1 ? "s" : ""}
                      {e.capacity ? ` / ${e.capacity}` : ""}
                    </span>
                  </div>

                  {e.registrations.length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-noir-3 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cream/45">
                        Liste des inscrits
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-cream/75">
                        {e.registrations.map((r) => (
                          <li key={r.id}>
                            {r.user.name ?? r.user.email} — {r.people} personne
                            {r.people > 1 ? "s" : ""}
                            {r.comment ? ` · ${r.comment}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-bold text-jaune">
                      Modifier l&apos;événement
                    </summary>
                    <div className="mt-4">
                      <EditEventForm evenement={e} />
                    </div>
                  </details>

                  <form action={supprimerEvenement} className="mt-3">
                    <input type="hidden" name="eventId" value={e.id} />
                    <button className="text-xs font-bold text-red-300 hover:text-red-200">
                      Supprimer l&apos;événement
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
