"use client";

import Link from "next/link";
import { useState } from "react";

type Lien = { href: string; label: string };
type Groupe = { titre: string; liens: Lien[] };

export default function MobileNav({
  links,
  groupes,
}: {
  links: Lien[];
  /** Sous-menus repliables ; sans eux, tous les liens s'affichent à plat. */
  groupes?: Groupe[];
}) {
  const [open, setOpen] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);

  function fermerTout() {
    setOpen(false);
    setOuvert(null);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full border border-white/15"
      >
        <span className="relative block h-[14px] w-5">
          <span
            className={`absolute left-0 h-[2px] w-5 bg-cream transition-all ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 h-[2px] w-5 bg-cream transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 h-[2px] w-5 bg-cream transition-all ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={fermerTout}
            className="fixed inset-0 top-16 z-40 bg-black/60"
          />

          <nav className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-noir-2 p-4">
            {groupes ? (
              <ul className="space-y-1">
                {groupes.map((g) => {
                  const deplie = ouvert === g.titre;
                  return (
                    <li key={g.titre}>
                      <button
                        type="button"
                        aria-expanded={deplie}
                        onClick={() => setOuvert(deplie ? null : g.titre)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition ${
                          deplie ? "bg-white/5 text-jaune" : "text-cream/85"
                        }`}
                      >
                        {g.titre}
                        <span
                          aria-hidden
                          className={`text-xs transition-transform ${
                            deplie ? "rotate-180" : ""
                          }`}
                        >
                          &#9662;
                        </span>
                      </button>

                      {deplie && (
                        <ul className="mb-1 ml-3 space-y-0.5 border-l border-jaune/30 pl-3">
                          {g.liens.map((l) => (
                            <li key={l.href}>
                              <Link
                                href={l.href}
                                onClick={fermerTout}
                                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-cream/75 hover:bg-white/5 hover:text-jaune"
                              >
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={fermerTout}
                      className="block rounded-xl px-4 py-3 text-base font-semibold text-cream/85 hover:bg-white/5 hover:text-jaune"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
