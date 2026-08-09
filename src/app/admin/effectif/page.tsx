import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import PlayerForm from "./PlayerForm";
import RoleForm from "./RoleForm";
import { supprimerJoueur } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminEffectifPage() {
  const session = await auth();
  const [teams, comptes] = await Promise.all([
    prisma.team.findMany({
      orderBy: { order: "asc" },
      include: {
        players: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-xl font-black uppercase">Ajouter un joueur</h2>
        <PlayerForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      {teams.map((team) => (
        <section key={team.id}>
          <h2 className="font-display text-xl font-black uppercase">
            {team.name} <span className="text-sm text-cream/40">({team.players.length})</span>
          </h2>

          {team.players.length === 0 ? (
            <p className="card mt-4 text-sm text-cream/60">Effectif vide.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {team.players.map((p) => (
                <li
                  key={p.id}
                  className="card flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-cream/45">
                      {p.position ?? "Joueur"}
                      {p.number != null ? ` · n°${p.number}` : ""}
                    </p>
                  </div>
                  <form action={supprimerJoueur}>
                    <input type="hidden" name="playerId" value={p.id} />
                    <button className="text-xs font-bold text-red-300 hover:text-red-200">
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {session?.user.role === "ADMIN" && (
        <section>
          <h2 className="font-display text-xl font-black uppercase">Comptes et rôles</h2>
          <p className="mt-1 text-xs text-cream/50">
            Un dirigeant peut modifier le calendrier, les effectifs et les actualités.
          </p>
          <ul className="mt-4 space-y-3">
            {comptes.map((u) => (
              <li key={u.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{u.name ?? "Sans nom"}</p>
                  <p className="text-xs text-cream/45">{u.email}</p>
                </div>
                <RoleForm userId={u.id} current={u.role} isSelf={u.id === session.user.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
