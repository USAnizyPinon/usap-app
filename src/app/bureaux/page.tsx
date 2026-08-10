import { prisma } from "@/lib/prisma";
import PersonCard from "@/components/PersonCard";

// Page mise en cache : affichage instantane.
// Toute modification par un dirigeant rafraichit la page aussitot.
export const revalidate = 600;
export const metadata = { title: "Les bureaux" };

const GROUPS = [
  { key: "BUREAU" as const, title: "Le bureau directeur", sub: "La direction du club" },
  {
    key: "ANIMATION" as const,
    title: "Le bureau d'animation",
    sub: "Vie du club et événements",
  },
  { key: "RESPONSABLE" as const, title: "Les responsables", sub: "Les pôles du club" },
  { key: "COMITE" as const, title: "Le comité directeur", sub: "Membres du comité" },
];

export default async function ClubPage() {
  const [membres, encadrement] = await Promise.all([
    prisma.boardMember.findMany({ orderBy: [{ order: "asc" }, { lastName: "asc" }] }),
    prisma.staff.findMany({
      orderBy: [{ lastName: "asc" }],
      include: { team: { select: { name: true, order: true } } },
    }),
  ]);

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Qui fait tourner le club</p>
      <h1 className="title mt-3">Les bureaux</h1>
      <p className="mt-5 max-w-2xl text-cream/70">
        Direction, animation, pôles et comité : le club fonctionne grâce à ses bénévoles.
        Voici celles et ceux qui s'en occupent.
      </p>

      {membres.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Les bureaux ne sont pas encore renseignés.
        </p>
      ) : (
        GROUPS.map((g) => {
          const list = membres.filter((m) => m.group === g.key);
          if (list.length === 0) return null;
          return (
            <section key={g.key} className="mt-12">
              <p className="eyebrow">{g.sub}</p>
              <h2 className="mt-3 font-display text-2xl font-black uppercase">{g.title}</h2>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {list.map((m) => (
                  <PersonCard
                    key={m.id}
                    name={`${m.firstName} ${m.lastName}`.trim()}
                    role={m.role}
                    photo={m.photo}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* ---------------- ENCADREMENT ---------------- */}
      {encadrement.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">Sur le terrain</p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase">
            Les éducateurs
          </h2>
          <p className="mt-2 text-sm text-cream/55">
            Celles et ceux qui encadrent les équipes chaque semaine.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {encadrement.map((e) => (
              <PersonCard
                key={e.id}
                name={`${e.firstName} ${e.lastName}`.trim()}
                role={e.team ? `${e.role} · ${e.team.name}` : e.role}
                photo={e.photo}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
