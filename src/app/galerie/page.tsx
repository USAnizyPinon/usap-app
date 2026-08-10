import { prisma } from "@/lib/prisma";

export const revalidate = 300;
export const metadata = { title: "Galerie" };

export default async function GaleriePage() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
    include: { team: { select: { name: true } } },
  });

  // Regroupement par saison
  const saisons = new Map<string, typeof photos>();
  for (const p of photos) {
    const liste = saisons.get(p.season) ?? [];
    liste.push(p);
    saisons.set(p.season, liste);
  }

  return (
    <div className="wrap py-12">
      <p className="eyebrow">En images</p>
      <h1 className="title mt-3">La galerie</h1>

      {photos.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucune photo pour le moment. Les dirigeants les ajoutent depuis leur téléphone.
        </p>
      ) : (
        [...saisons.entries()].map(([saison, liste]) => (
          <section key={saison} className="mt-10">
            <h2 className="font-display text-xl font-black uppercase">
              Saison {saison}{" "}
              <span className="text-sm text-cream/40">({liste.length})</span>
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {liste.map((p) => (
                <figure
                  key={p.id}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-noir-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption ?? ""}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {(p.caption || p.team) && (
                    <figcaption className="px-3 py-2">
                      {p.caption && (
                        <p className="text-xs text-cream/80">{p.caption}</p>
                      )}
                      {p.team && (
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-jaune">
                          {p.team.name}
                        </p>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
