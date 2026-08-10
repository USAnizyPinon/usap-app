import Link from "next/link";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-16 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="mx-auto h-24 w-auto opacity-80" />

        <p className="eyebrow mt-8 justify-center">Erreur 404</p>
        <h1 className="title mt-4 text-3xl sm:text-4xl">
          Cette page est <span className="text-jaune">hors-jeu</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-cream/65">
          L&apos;adresse demandée n&apos;existe pas ou n&apos;existe plus.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-jaune">
            Retour à l&apos;accueil
          </Link>
          <Link href="/matchs" className="btn-ghost">
            Voir les matchs
          </Link>
        </div>
      </div>
    </div>
  );
}
