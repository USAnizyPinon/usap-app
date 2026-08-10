"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-16 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="mx-auto h-24 w-auto opacity-80" />

        <p className="eyebrow mt-8 justify-center">Incident technique</p>
        <h1 className="title mt-4 text-3xl sm:text-4xl">
          Un <span className="text-jaune">contre-temps</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-cream/65">
          Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant ; si le
          problème persiste, prévenez le club.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-jaune">
            Réessayer
          </button>
          <Link href="/" className="btn-ghost">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
