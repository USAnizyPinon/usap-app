import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

// Page mise en cache : affichage instantane.
// Toute modification par un dirigeant rafraichit la page aussitot.
export const revalidate = 120;
export const metadata = { title: "Actualités" };

export default async function ActusPage() {
  const actus = await prisma.news.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Le club</p>
      <h1 className="title mt-3">Actualités</h1>

      {actus.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucune actualité publiée pour le moment.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {actus.map((a) => (
            <article key={a.id} className="card sm:flex sm:gap-6">
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image}
                  alt=""
                  loading="lazy"
                  className="mb-4 h-44 w-full rounded-xl object-cover sm:mb-0 sm:h-32 sm:w-48 sm:shrink-0"
                />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-jaune/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-jaune">
                    {a.tag}
                  </span>
                  <time className="text-[11px] uppercase tracking-wider text-cream/40">
                    {formatDate(a.publishedAt)}
                  </time>
                </div>
                <h2 className="mt-2 font-display text-xl font-black leading-tight">
                  {a.title}
                </h2>
                <p className="mt-2 text-sm text-cream/70">{a.excerpt}</p>
                {a.body && (
                  <p className="mt-3 whitespace-pre-line text-sm text-cream/60">{a.body}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
