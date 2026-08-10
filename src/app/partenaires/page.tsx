import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;
export const metadata = { title: "Partenaires" };

export default async function PartenairesPage() {
  const partenaires = await prisma.partner.findMany({
    where: { visible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const majeurs = partenaires.filter((p) => p.tier === "PRINCIPAL");
  const officiels = partenaires.filter((p) => p.tier === "OFFICIEL");
  const soutiens = partenaires.filter((p) => p.tier === "SUPPORTER");

  return (
    <>
      {/* ---------------- PARTENAIRES MAJEURS ---------------- */}
      {majeurs.length > 0 && (
        <section className="wrap py-14">
          <p className="eyebrow">Au plus près du club</p>
          <h1 className="title mt-3 text-4xl sm:text-5xl">
            Partenaires <span className="italic text-jaune">majeurs</span>
          </h1>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {majeurs.map((p) => (
              <article
                key={p.id}
                className="card flex flex-col gap-5 transition hover:border-jaune/40 sm:flex-row"
              >
                {p.logo && (
                  <div className="grid h-32 w-32 shrink-0 place-items-center rounded-2xl bg-white/95 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.logo}
                      alt={p.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.25em] text-jaune">
                    Partenaire majeur
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-black leading-tight">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-cream/70">
                      {p.description}
                    </p>
                  )}
                  <Link
                    href={`/partenaires/${p.slug}`}
                    className="mt-4 inline-block text-sm font-bold text-jaune hover:underline"
                  >
                    Voir la fiche →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- PARTENAIRES OFFICIELS ---------------- */}
      <section className="bg-cream py-16 text-noir">
        <div className="wrap">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.28em] text-jaune-deep">
            Commerçants · Artisans · Collectivités
          </p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none sm:text-5xl">
            Partenaires <span className="italic text-jaune-deep">officiels</span>
          </h2>
          <p className="mt-4 max-w-xl text-noir/65">
            Le tissu économique et institutionnel local qui fait vivre le club au quotidien.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {officiels.map((p) => (
              <Link
                key={p.id}
                href={`/partenaires/${p.slug}`}
                className="group flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="grid h-20 w-full place-items-center">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo}
                      alt={p.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="font-display text-lg font-black">{p.name}</span>
                  )}
                </div>
                <span className="text-center text-[11px] font-bold uppercase tracking-wide text-noir/70 group-hover:text-noir">
                  {p.name}
                </span>
              </Link>
            ))}

            {/* Emplacement libre : sert d'argument pour démarcher */}
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-jaune-deep/40 bg-jaune/10 p-6 text-center">
              <p className="font-display text-lg font-black">Votre enseigne&nbsp;?</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-noir/55">
                Une place vous attend
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ILS NOUS SOUTIENNENT ---------------- */}
      {soutiens.length > 0 && (
        <section className="wrap py-14">
          <p className="eyebrow">Merci à eux</p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase">
            Ils nous soutiennent
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
            {soutiens.map((p) =>
              p.logo ? (
                <Link key={p.id} href={`/partenaires/${p.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo}
                    alt={p.name}
                    loading="lazy"
                    className="h-12 w-auto object-contain opacity-70 transition hover:opacity-100"
                  />
                </Link>
              ) : (
                <span key={p.id} className="text-sm font-bold text-cream/70">
                  {p.name}
                </span>
              )
            )}
          </div>
        </section>
      )}

      {/* ---------------- DEVENIR PARTENAIRE ---------------- */}
      <section className="wrap pb-16">
        <div className="card">
          <h2 className="font-display text-xl font-black uppercase">Devenir partenaire</h2>
          <p className="mt-3 max-w-2xl text-sm text-cream/70">
            Votre logo sur les équipements, au stade, sur le site et dans l&apos;application
            du club. Plusieurs formules existent selon votre budget : contactez le bureau
            pour en discuter.
          </p>
        </div>
      </section>
    </>
  );
}
