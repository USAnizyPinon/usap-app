import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import NewsForm from "./NewsForm";
import { supprimerActu } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminActusPage() {
  const actus = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-xl font-black uppercase">Publier une actualité</h2>
        <NewsForm />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Publiées <span className="text-sm text-cream/40">({actus.length})</span>
        </h2>

        {actus.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucune actualité.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {actus.map((a) => (
              <li key={a.id} className="card flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-jaune/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-jaune">
                      {a.tag}
                    </span>
                    <time className="text-[11px] uppercase tracking-wider text-cream/40">
                      {formatDate(a.publishedAt)}
                    </time>
                  </div>
                  <p className="mt-2 font-bold">{a.title}</p>
                  <p className="mt-1 max-w-xl text-xs text-cream/55">{a.excerpt}</p>
                </div>
                <form action={supprimerActu}>
                  <input type="hidden" name="newsId" value={a.id} />
                  <button className="text-xs font-bold text-red-300 hover:text-red-200">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
