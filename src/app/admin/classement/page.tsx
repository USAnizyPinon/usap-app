import { prisma } from "@/lib/prisma";
import StandingForm from "./StandingForm";
import RowForm from "./RowForm";
import { supprimerLigneClassement } from "../actions-plus";

export const dynamic = "force-dynamic";

export default async function AdminClassementPage({
  searchParams,
}: {
  searchParams: { equipe?: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });
  const active = searchParams.equipe ?? teams[0]?.slug;
  const team = teams.find((t) => t.slug === active);

  const lignes = team
    ? await prisma.standingRow.findMany({
        where: { teamId: team.id },
        orderBy: { position: "asc" },
      })
    : [];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-2">
        {teams.map((t) => (
          <a
            key={t.id}
            href={`/admin/classement?equipe=${t.slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              active === t.slug
                ? "border-jaune bg-jaune text-noir"
                : "border-white/15 text-cream/70 hover:border-jaune hover:text-jaune"
            }`}
          >
            {t.name}
          </a>
        ))}
      </div>

      {team && (
        <>
          <section>
            <h2 className="font-display text-xl font-black uppercase">
              Ajouter un club — {team.name}
            </h2>
            <p className="mt-1 text-xs text-cream/50">
              Les points sont calculés tout seuls (3 par victoire, 1 par nul).
            </p>
            <StandingForm teamId={team.id} position={lignes.length + 1} />
          </section>

          <section>
            <h2 className="font-display text-xl font-black uppercase">
              Le classement <span className="text-sm text-cream/40">({lignes.length})</span>
            </h2>

            {lignes.length === 0 ? (
              <p className="card mt-4 text-sm text-cream/60">
                Classement vide pour cette catégorie.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {lignes.map((l) => (
                  <li key={l.id} className="card">
                    <RowForm ligne={l} />
                    <form action={supprimerLigneClassement} className="mt-3">
                      <input type="hidden" name="rowId" value={l.id} />
                      <button className="text-xs font-bold text-red-300 hover:text-red-200">
                        Retirer cette ligne
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
