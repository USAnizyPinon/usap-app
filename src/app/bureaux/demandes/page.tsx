import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import DecisionForm from "./DecisionForm";
import { supprimerDemande } from "../demandes-actions";

export const dynamic = "force-dynamic";

export default async function AdminDemandesPage() {
  const demandes = await prisma.joinRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      team: { select: { name: true } },
      user: { select: { name: true, email: true, image: true } },
    },
  });

  const attente = demandes.filter((d) => d.status === "EN_ATTENTE");
  const traitees = demandes.filter((d) => d.status !== "EN_ATTENTE");

  return (
    <div className="space-y-10">
      <div className="card">
        <h2 className="font-display text-xl font-black uppercase">Comment ça marche</h2>
        <p className="mt-3 text-sm text-cream/70">
          Un licencié qui se connecte peut demander à rejoindre le club depuis
          <b> Mon compte</b> : il choisit sa catégorie (ou « supporter »), renseigne son
          prénom, son nom et sa photo. Sa demande arrive ici. Si vous l&apos;acceptez, sa
          fiche est créée automatiquement dans l&apos;effectif de sa catégorie et il en est
          averti.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          En attente <span className="text-sm text-cream/40">({attente.length})</span>
        </h2>

        {attente.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucune demande en attente.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {attente.map((d) => (
              <li key={d.id} className="card">
                <div className="flex flex-wrap items-start gap-4">
                  {d.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.photo}
                      alt=""
                      className="h-20 w-16 rounded-lg object-cover object-top"
                    />
                  ) : (
                    <div className="grid h-20 w-16 place-items-center rounded-lg border border-white/10 bg-noir-3 text-xs text-cream/30">
                      Sans<br />photo
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-black uppercase">
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="mt-1 text-sm text-jaune">
                      {d.supporter ? "Supporter du club" : (d.team?.name ?? "Sans catégorie")}
                    </p>
                    <p className="mt-1 text-xs text-cream/45">
                      Compte : {d.user.email} · demandé le {formatDate(d.createdAt)}
                    </p>
                    {d.message && (
                      <p className="mt-2 rounded-lg border border-white/10 bg-noir-3 px-3 py-2 text-xs text-cream/70">
                        {d.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <DecisionForm requestId={d.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {traitees.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-black uppercase">Déjà traitées</h2>
          <ul className="mt-4 space-y-3">
            {traitees.map((d) => (
              <li key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {d.firstName} {d.lastName}
                  </p>
                  <p className="text-xs text-cream/45">
                    {d.supporter ? "Supporter" : (d.team?.name ?? "—")} · {d.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      d.status === "ACCEPTEE"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-400/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {d.status === "ACCEPTEE" ? "Acceptée" : "Refusée"}
                  </span>
                  <form action={supprimerDemande}>
                    <input type="hidden" name="requestId" value={d.id} />
                    <button className="text-xs font-bold text-cream/50 hover:text-red-300">
                      Effacer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
