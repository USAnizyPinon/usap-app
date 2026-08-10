"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";

const LINKS = [
  { href: "/matchs", label: "Matchs" },
  { href: "/equipes", label: "Équipes" },
  { href: "/actus", label: "Actus" },
  { href: "/club", label: "Le club" },
];

/**
 * En-tete cote navigateur : la session est lue par le client.
 * Cela permet aux pages publiques d'etre mises en cache = navigation instantanee.
 */
export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const editor = role === "ADMIN" || role === "DIRIGEANT";

  const links = [
    ...LINKS,
    ...(session ? [{ href: "/mon-espace", label: "Mon compte" }] : []),
    ...(editor ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-noir/90 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="US Anizy-Pinon" className="h-10 w-auto" />
          <span className="leading-none">
            <span className="block font-display text-sm font-black uppercase tracking-wide">
              Anizy-Pinon
            </span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-cream/50">
              Union Sportive
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-cream/75 transition hover:bg-white/5 hover:text-jaune"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu
            name={session?.user?.name ?? null}
            image={session?.user?.image ?? null}
            role={role ?? null}
          />
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
