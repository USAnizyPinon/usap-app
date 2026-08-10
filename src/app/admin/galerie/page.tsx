import { prisma } from "@/lib/prisma";
import PhotoUploadForm from "./PhotoUploadForm";
import { supprimerPhoto } from "../actions-plus";

export const dynamic = "force-dynamic";

export default async function AdminGaleriePage() {
  const [photos, teams] = await Promise.all([
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-black uppercase">Ajouter une photo</h2>
        <PhotoUploadForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          La galerie <span className="text-sm text-cream/40">({photos.length})</span>
        </h2>

        {photos.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucune photo.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-white/10 bg-noir-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-xs text-cream/75">{p.caption ?? "Sans légende"}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-cream/40">
                    {p.season}
                    {p.team ? ` · ${p.team.name}` : ""}
                  </p>
                  <form action={supprimerPhoto} className="mt-2">
                    <input type="hidden" name="photoId" value={p.id} />
                    <button className="text-xs font-bold text-red-300 hover:text-red-200">
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
