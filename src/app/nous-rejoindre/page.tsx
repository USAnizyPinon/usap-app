import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Team } from "@prisma/client";

export const revalidate = 600;
export const metadata = {
  title: "Nous rejoindre",
  description:
    "Créneaux d'entraînement, dates de reprise et contacts par catégorie pour rejoindre l'US Anizy Pinon.",
};

const GROUPES = [
  { titre: "École de foot", slugs: ["u6-u7", "u8-u9", "u10-u11", "u12-u13", "pole-feminin-jeune"] },
  { titre: "Football à 11", slugs: ["u14-u15", "u16-u18"] },
  { titre: "Adultes", slugs: ["seniors", "feminines-seniors", "veterans"] },
];

export default async function NousRejoindrePage() {
  const session = await auth();
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });
  const parSlug = new Map(teams.map((t) => [t.slug, t]));

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Portes ouvertes</p>
      <h1 className="title mt-3 text-4xl sm:text-5xl">
        Nous <span className="text-jaune">rejoindre</span>
      </h1>
      <p className="mt-5 max-w-2xl text-cream/70">
        Les entraînements sont ouverts à l&apos;essai : venez avec une tenue de sport, sans
        engagement. Retrouvez ci-dessous les créneaux et la personne à contacter pour
        chaque catégorie.
      </p>

      {GROUPES.map((g) => {
        const liste = g.slugs
          .map((s) => parSlug.get(s))
          .filter((t): t is Team => t !== undefined);
        if (liste.length === 0) return null;

        return (
          <section key={g.titre} className="mt-12">
            <h2 className="font-display text-2xl font-black uppercase text-jaune">
              {g.titre}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liste.map((t) => (
                <article key={t.id} className="card">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl font-black uppercase leading-none">
                      {t.name}
                    </h3>
                    {t.birthYears && (
                      <span className="shrink-0 text-[11px] text-cream/45">
                        {t.birthYears}
                      </span>
                    )}
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    {t.trainDays && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-cream/45">
                          Entraînements
                        </dt>
                        <dd className="font-semibold">
                          {t.trainDays}
                          {t.trainHours ? ` · ${t.trainHours}` : ""}
                        </dd>
                      </div>
                    )}
                    {t.venue && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-cream/45">
                          Lieu
                        </dt>
                        <dd className="font-semibold">{t.venue}</dd>
                      </div>
                    )}
                    {t.restartDate && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-cream/45">
                          Reprise
                        </dt>
                        <dd className="font-semibold text-jaune">{t.restartDate}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Les numéros personnels ne sont pas exposés publiquement */}
                  {t.contactTel &&
                    (session ? (
                      <a
                        href={`tel:${t.contactTel.replace(/\s/g, "")}`}
                        className="btn-ghost mt-4 !py-2 text-xs"
                      >
                        {t.contactTel}
                      </a>
                    ) : (
                      <p className="mt-4 text-xs text-cream/45">
                        <Link href="/connexion" className="underline hover:text-jaune">
                          Connectez-vous
                        </Link>{" "}
                        pour voir le contact, ou écrivez au club.
                      </p>
                    ))}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* Inscription */}
      <section className="mt-14 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-display text-xl font-black uppercase">
            Les pièces à fournir
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li>• Une photo d&apos;identité récente</li>
            <li>• Une pièce d&apos;identité (ou le livret de famille pour les mineurs)</li>
            <li>
              • Un certificat médical de non contre-indication, ou le questionnaire de santé
            </li>
            <li>• L&apos;autorisation parentale pour les mineurs</li>
            <li>• Le règlement de la cotisation</li>
          </ul>
          <p className="mt-4 text-xs text-cream/45">
            La demande de licence se fait ensuite en ligne : le club vous envoie un lien par
            courriel.
          </p>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-black uppercase">Nous contacter</h2>
          <p className="mt-4 text-sm text-cream/70">
            Une question sur une catégorie, la cotisation ou les documents ? Écrivez-nous,
            nous répondons rapidement.
          </p>
          <a href="mailto:usanizypinon1@gmail.com" className="btn-jaune mt-5">
            usanizypinon1@gmail.com
          </a>
          <p className="mt-5 text-xs text-cream/45">
            Siège : Mairie, 02320 Anizy-le-Grand · Stades d&apos;Anizy et de Pinon
          </p>
        </div>
      </section>
    </div>
  );
}
