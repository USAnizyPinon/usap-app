import { prisma } from "@/lib/prisma";

export const revalidate = 600;
export const metadata = { title: "Partenaires" };

const NIVEAUX = {
  PRINCIPAL: { titre: "Partenaires principaux", taille: "h-24" },
  OFFICIEL: { titre: "Partenaires officiels", taille: "h-16" },
  SUPPORTER: { titre: "Ils nous soutiennent", taille: "h-12" },
} as const;

export default async function PartenairesPage() {
  const partenaires = await prisma.partner.findMany({
    where: { visible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Ils font vivre le club</p>
      <h1 className="title mt-3">Nos partenaires</h1>
      <p className="mt-5 max-w-2xl text-cream/70">
        Le club existe grâce au soutien des entreprises et commerçants du secteur. Merci à
        eux.
      </p>

      {partenaires.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucun partenaire enregistré pour le moment.
        </p>
      ) : (
        (Object.keys(NIVEAUX) as (keyof typeof NIVEAUX)[]).map((niveau) => {
          const liste = partenaires.filter((p) => p.tier === niveau);
          if (liste.length === 0) return null;
          const { titre, taille } = NIVEAUX[niveau];

          return (
            <section key={niveau} className="mt-12">
              <h2 className="font-display text-xl font-black uppercase">{titre}</h2>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {liste.map((p) => {
                  const contenu = (
                    <div className="card flex h-full flex-col items-center justify-center gap-3 py-8 transition hover:border-jaune/40">
                      {p.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo}
                          alt={p.name}
                          loading="lazy"
                          className={`${taille} w-auto max-w-full object-contain`}
                        />
                      ) : (
                        <span className="font-display text-lg font-black text-cream/70">
                          {p.name}
                        </span>
                      )}
                      {p.logo && (
                        <span className="text-center text-xs text-cream/55">{p.name}</span>
                      )}
                    </div>
                  );

                  return p.website ? (
                    <a
                      key={p.id}
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contenu}
                    </a>
                  ) : (
                    <div key={p.id}>{contenu}</div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <div className="card mt-14">
        <h2 className="font-display text-xl font-black uppercase">Devenir partenaire</h2>
        <p className="mt-3 text-sm text-cream/70">
          Votre logo sur les maillots, au stade et dans l&apos;application du club.
          Contactez le bureau pour connaître les formules.
        </p>
      </div>
    </div>
  );
}
