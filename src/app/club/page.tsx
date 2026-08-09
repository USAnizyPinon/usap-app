import { prisma } from "@/lib/prisma";
import PersonCard from "@/components/PersonCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Le club" };

const GROUPS = [
  { key: "BUREAU" as const, title: "Le bureau", sub: "La direction du club" },
  { key: "RESPONSABLE" as const, title: "Les responsables", sub: "Les pôles du club" },
  { key: "COMITE" as const, title: "Le comité directeur", sub: "Membres du comité" },
];

export default async function ClubPage() {
  const membres = await prisma.boardMember.findMany({
    orderBy: [{ order: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Qui sommes-nous</p>
      <h1 className="title mt-3">Le club</h1>
      <p className="mt-5 max-w-2xl text-cream/70">
        L'Union Sportive Anizy-Pinon rassemble les licenciés des deux communes, des plus
        jeunes aux vétérans. Le club vit grâce à ses bénévoles : voici celles et ceux qui le
        font tourner.
      </p>

      {membres.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          L'organigramme n'est pas encore renseigné.
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
    </div>
  );
}
