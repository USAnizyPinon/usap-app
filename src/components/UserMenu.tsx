"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

/**
 * En haut à droite : uniquement la photo de profil.
 * Un appui mène à l'espace personnel, un appui long ouvre le menu.
 */
export default function UserMenu({
  name,
  image,
  role,
}: {
  name: string | null;
  image: string | null;
  role: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!name) {
    return (
      <button onClick={() => signIn("google")} className="btn-jaune !px-4 !py-2 text-xs">
        Se connecter
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <Link
          href="/mon-espace"
          aria-label="Mon espace"
          className="rounded-full ring-jaune transition hover:ring-2"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-jaune text-sm font-black text-noir">
              {name.charAt(0)}
            </span>
          )}
        </Link>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu du compte"
          aria-haspopup="menu"
          aria-expanded={open}
          className="ml-0.5 px-1 text-[10px] text-cream/50 transition hover:text-jaune"
        >
          ▾
        </button>
      </div>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-noir-2 p-2 shadow-card"
          >
            <p className="px-3 py-2 text-xs text-cream/55">
              Connecté en tant que
              <span className="mt-0.5 block font-semibold text-cream">{name}</span>
              {role && role !== "LICENCIE" && (
                <span className="mt-1 inline-block rounded bg-jaune/15 px-2 py-0.5 text-[10px] font-bold uppercase text-jaune">
                  {role}
                </span>
              )}
            </p>

            <Link
              href="/mon-espace"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-cream/80 hover:bg-white/5 hover:text-jaune"
            >
              Mon espace
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-0.5 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-cream/80 hover:bg-white/5 hover:text-jaune"
            >
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
