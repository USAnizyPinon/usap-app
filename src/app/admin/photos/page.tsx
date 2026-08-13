import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import PhotoDecision from "./PhotoDecision";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const enAttente = await prisma.player.findMany({
    where: { pendingPhoto: { not: null } },
    orderBy: { pendingAt: "asc" },
    include: { team: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="font-display text-xl font-black uppercase">
          Photos proposées par les joueurs
        </h2>
        <p className="mt-2 text-sm text-cream/70">
          Un licencié déjà dans l&apos;effectif peut proposer sa photo depuis son espace.
          Elle ne s&apos;affiche publiquement qu&apos;une fois validée ici.
        </p>
      </div>

      {enAttente.length === 0 ? (
        <p className="card text-sm text-cream/60">Aucune photo en attente.</p>
      ) : (
        <ul className="space-y-4">
          {enAttente.map((p) => (
            <li key={p.id} className="card">
              <div className="flex flex-wrap items-start gap-5">
                <div className="text-center">
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-cream/45">
                    Actuelle
                  </p>
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo}
                      alt=""
                      className="h-32 w-24 rounded-lg object-cover object-top"
                    />
                  ) : (
                    <div className="grid h-32 w-24 place-items-center rounded-lg border border-white/10 bg-noir-3 text-xs text-cream/30">
                      Aucune
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-jaune">
                    Proposée
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.pendingPhoto as string}
                    alt=""
                    className="h-32 w-24 rounded-lg border-2 border-jaune/50 object-cover object-top"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black uppercase">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="mt-1 text-xs text-cream/45">
                    {p.team.name}
                    {p.pendingAt ? ` · proposée le ${formatDate(p.pendingAt)}` : ""}
                  </p>
                  <div className="mt-4">
                    <PhotoDecision playerId={p.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
