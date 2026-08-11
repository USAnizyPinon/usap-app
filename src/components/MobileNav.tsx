"use client";

import Link from "next/link";
import { useState } from "react";

type Lien = { href: string; label: string };

export default function MobileNav({
  links,
  groupes,
}: {
  links: Lien[];
  /** Sections affichées avec un intertitre ; le reste suit à plat. */
  groupes?: { titre: string; liens: Lien[] }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
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
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-40 bg-black/60"
          />
          <nav className="fixed inset-x-0 top-16 z-40 border-b border-white/10 bg-noir-2 p-4">
            {groupes ? (
              <div className="max-h-[calc(100dvh-6rem)] space-y-5 overflow-y-auto">
                {groupes.map((g) => (
                  <div key={g.titre}>
                    <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-[.2em] text-jaune">
                      {g.titre}
                    </p>
                    <ul className="space-y-1">
                      {g.liens.map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-xl px-4 py-3 text-base font-semibold text-cream/85 hover:bg-white/5 hover:text-jaune"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
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
