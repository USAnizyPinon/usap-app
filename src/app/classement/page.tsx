import { prisma } from "@/lib/prisma";

export const revalidate = 300;
export const metadata = { title: "Classement" };

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: { equipe?: string };
}) {
  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { standing: true } } },
  });

  const avecClassement = teams.filter((t) => t._count.standing > 0);
  const active = searchParams.equipe ?? avecClassement[0]?.slug;
  const team = teams.find((t) => t.slug === active);

  const lignes = team
    ? await prisma.standingRow.findMany({
        where: { teamId: team.id },
        orderBy: { position: "asc" },
      })
    : [];

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Championnat</p>
      <h1 className="title mt-3">Classement</h1>

      {avecClassement.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucun classement publié pour le moment.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {avecClassement.map((t) => (
              <a
                key={t.id}
                href={`/classement?equipe=${t.slug}`}
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

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-noir-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-cream/45">
                  <th className="px-3 py-3 text-left font-bold">#</th>
                  <th className="px-3 py-3 text-left font-bold">Club</th>
                  <th className="px-2 py-3 text-center font-bold">Pts</th>
                  <th className="px-2 py-3 text-center font-bold">J</th>
                  <th className="px-2 py-3 text-center font-bold">G</th>
                  <th className="px-2 py-3 text-center font-bold">N</th>
                  <th className="px-2 py-3 text-center font-bold">P</th>
                  <th className="px-2 py-3 text-center font-bold">Diff</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => {
                  const points = l.won * 3 + l.drawn;
                  const diff = l.goalsFor - l.goalsAgainst;
                  return (
                    <tr
                      key={l.id}
                      className={`border-b border-white/5 last:border-0 ${
                        l.isUsap ? "bg-jaune/10" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-display font-black text-cream/50">
                        {l.position}
                      </td>
                      <td
                        className={`px-3 py-3 font-bold ${
                          l.isUsap ? "text-jaune" : "text-cream/90"
                        }`}
                      >
                        {l.clubName}
                      </td>
                      <td className="px-2 py-3 text-center font-display text-base font-black text-jaune">
                        {points}
                      </td>
                      <td className="px-2 py-3 text-center text-cream/70">{l.played}</td>
                      <td className="px-2 py-3 text-center text-cream/70">{l.won}</td>
                      <td className="px-2 py-3 text-center text-cream/70">{l.drawn}</td>
                      <td className="px-2 py-3 text-center text-cream/70">{l.lost}</td>
                      <td className="px-2 py-3 text-center text-cream/70">
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-cream/40">
            Pts = points · J = joués · G = gagnés · N = nuls · P = perdus · Diff =
            différence de buts
          </p>
        </>
      )}
    </div>
  );
}
