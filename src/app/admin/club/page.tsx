import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BoardForm from "./BoardForm";
import StaffForm from "./StaffForm";
import { supprimerMembreBureau, supprimerStaff } from "../actions";

export const dynamic = "force-dynamic";

const GROUPES = {
  BUREAU: "Le bureau",
  RESPONSABLE: "Les responsables",
  COMITE: "Le comité directeur",
} as const;

export default async function AdminClubPage() {
  const [membres, staff, teams] = await Promise.all([
    prisma.boardMember.findMany({ orderBy: [{ order: "asc" }, { lastName: "asc" }] }),
    prisma.staff.findMany({
      orderBy: [{ lastName: "asc" }],
      include: { team: { select: { name: true } } },
    }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-14">
      {/* ---------------- BUREAU ---------------- */}
      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Ajouter un membre du bureau
        </h2>
        <BoardForm />
      </section>

      {(Object.keys(GROUPES) as (keyof typeof GROUPES)[]).map((g) => {
        const liste = membres.filter((m) => m.group === g);
        return (
          <section key={g}>
            <h2 className="font-display text-xl font-black uppercase">
              {GROUPES[g]} <span className="text-sm text-cream/40">({liste.length})</span>
            </h2>

            {liste.length === 0 ? (
              <p className="card mt-4 text-sm text-cream/60">Personne pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {liste.map((m) => (
                  <li
                    key={m.id}
                    className="card flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {m.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.photo}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover object-top"
                        />
                      )}
                      <div>
                        <p className="font-bold">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-xs text-cream/45">{m.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/club/bureau/${m.id}`}
                        className="text-xs font-bold text-jaune hover:underline"
                      >
                        Modifier
                      </Link>
                      <form action={supprimerMembreBureau}>
                        <input type="hidden" name="memberId" value={m.id} />
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
        );
      })}

      {/* ---------------- ENCADREMENT ---------------- */}
      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Ajouter un éducateur / entraîneur
        </h2>
        <StaffForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          L&apos;encadrement <span className="text-sm text-cream/40">({staff.length})</span>
        </h2>

        {staff.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun encadrant enregistré.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {staff.map((s) => (
              <li key={s.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {s.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover object-top"
                    />
                  )}
                  <div>
                    <p className="font-bold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-cream/45">
                      {s.role}
                      {s.team ? ` · ${s.team.name}` : " · sans catégorie"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/club/staff/${s.id}`}
                    className="text-xs font-bold text-jaune hover:underline"
                  >
                    Modifier
                  </Link>
                  <form action={supprimerStaff}>
                    <input type="hidden" name="staffId" value={s.id} />
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
    </div>
  );
}
