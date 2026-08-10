import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;

const NIVEAU: Record<string, string> = {
  PRINCIPAL: "Partenaire majeur",
  OFFICIEL: "Partenaire officiel",
  SUPPORTER: "Ils nous soutiennent",
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await prisma.partner.findUnique({ where: { slug: params.slug } });
  return { title: p?.name ?? "Partenaire" };
}

export default async function FichePartenaire({ params }: { params: { slug: string } }) {
  const p = await prisma.partner.findUnique({ where: { slug: params.slug } });
  if (!p || !p.visible) notFound();

  // Carte Google sans clé : l'adresse suffit
  const carte = p.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed`
    : null;
  const lienMaps = p.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
    : null;

  return (
    <div className="wrap py-12">
      <Link href="/partenaires" className="text-xs font-bold text-jaune hover:underline">
        ← Tous les partenaires
      </Link>

      <div className="card mt-6">
        {p.logo && (
          <div className="grid place-items-center rounded-2xl bg-white/95 p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.logo}
              alt={p.name}
              className="max-h-32 w-auto max-w-full object-contain"
            />
          </div>
        )}

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[.25em] text-jaune">
          {NIVEAU[p.tier]}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">
          {p.name}
        </h1>

        {p.description && (
          <p className="mt-4 max-w-2xl leading-relaxed text-cream/75">{p.description}</p>
        )}

        {(p.website || lienMaps) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-jaune"
              >
                Voir le site
              </a>
            )}
            {lienMaps && (
              <a
                href={lienMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Ouvrir dans Maps
              </a>
            )}
          </div>
        )}

        {carte && (
          <div className="mt-8">
            <p className="label">Où les trouver</p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                src={carte}
                title={`Carte : ${p.name}`}
                loading="lazy"
                className="h-72 w-full"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-2 text-xs text-cream/45">{p.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
