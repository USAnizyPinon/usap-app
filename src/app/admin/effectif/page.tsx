import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import PlayerForm from "./PlayerForm";
import { nomPublic } from "@/lib/affichage";
import RoleForm from "./RoleForm";
import Link from "next/link";
import { supprimerJoueur, appliquerAffichageNom, appliquerPhotos } from "../actions";

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

          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-noir-3 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cream/45">
              Droit à l&apos;image
            </span>
            <form action={appliquerAffichageNom} className="flex items-center gap-2">
              <input type="hidden" name="teamId" value={team.id} />
              <select name="nameDisplay" className="input !w-auto !py-1.5 text-xs" defaultValue="INITIALE">
                <option value="COMPLET">Prénom et nom</option>
                <option value="INITIALE">Prénom et initiale</option>
                <option value="PRENOM">Prénom seul</option>
              </select>
              <button className="text-xs font-bold text-jaune hover:underline">
                Appliquer à la catégorie
              </button>
            </form>
            <form action={appliquerPhotos}>
              <input type="hidden" name="teamId" value={team.id} />
              <input type="hidden" name="visible" value="false" />
              <button className="text-xs font-bold text-red-300 hover:text-red-200">
                Masquer toutes les photos
              </button>
            </form>
            <form action={appliquerPhotos}>
              <input type="hidden" name="teamId" value={team.id} />
              <input type="hidden" name="visible" value="true" />
              <button className="text-xs font-bold text-cream/50 hover:text-cream">
                Réafficher
              </button>
            </form>
          </div>

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
                      {!p.publicPhoto && " · photo masquée"}
                      {p.nameDisplay !== "COMPLET" && " · nom abrégé"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/effectif/${p.id}`}
                      className="text-xs font-bold text-jaune hover:underline"
                    >
                      Modifier
                    </Link>
                    <form action={supprimerJoueur}>
                      <input type="hidden" name="playerId" value={p.id} />
                      <button className="text-xs font-bold text-red-300 hover:text-red-200">
                        Retirer
                      </button>
                    </form>
                  </div>
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
