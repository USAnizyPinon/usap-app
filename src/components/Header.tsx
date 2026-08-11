"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";

// Barre principale : ce qu'on consulte le plus souvent
const LINKS = [
  { href: "/actus", label: "Actus" },
  { href: "/evenements", label: "Événements" },
];

// Tout ce qui touche au sportif
const EQUIPES = [
  { href: "/equipes", label: "Nos effectifs" },
  { href: "/matchs", label: "Calendrier" },
  { href: "/classement", label: "Classements" },
  { href: "/nous-rejoindre", label: "Entraînements" },
];

// La vie du club
const CLUB = [
  { href: "/galerie", label: "Galerie" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/bureaux", label: "Les bureaux" },
];

/**
 * En-tete cote navigateur : la session est lue par le client.
 * Cela permet aux pages publiques d'etre mises en cache = navigation instantanee.
 */
export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const editor = role === "ADMIN" || role === "DIRIGEANT";

  const suite = [
    ...(session ? [{ href: "/mon-espace", label: "Mon compte" }] : []),
    ...(editor ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  // Le menu mobile reprend tout, pour ne rien rendre inaccessible
  const links = [...EQUIPES, ...LINKS, ...CLUB, ...suite];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-noir/90 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="US Anizy Pinon" className="h-10 w-auto" />
          <span className="leading-none">
            <span className="block font-display text-sm font-black uppercase tracking-wide">
              Anizy Pinon
            </span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-cream/50">
              Union Sportive
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          <Menu titre="Nos équipes" liens={EQUIPES} />

          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-cream/75 transition hover:bg-white/5 hover:text-jaune"
            >
              {l.label}
            </Link>
          ))}

          <Menu titre="Le club" liens={CLUB} />

          {suite.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-cream/75 transition hover:bg-white/5 hover:text-jaune"
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
          {/* Le menu complet reste accessible partout */}
          <MobileNav
            links={links}
            groupes={[
              { titre: "Nos équipes", liens: EQUIPES },
              { titre: "Le club", liens: [...LINKS, ...CLUB] },
              ...(suite.length > 0 ? [{ titre: "Mon espace", liens: suite }] : []),
            ]}
          />
        </div>
      </div>
    </header>
  );
}

/** Menu déroulant de la barre : s'ouvre au survol et reste accessible au clavier. */
function Menu({
  titre,
  liens,
}: {
  titre: string;
  liens: { href: string; label: string }[];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-cream/75 transition hover:bg-white/5 hover:text-jaune group-hover:text-jaune"
      >
        {titre} <span aria-hidden className="text-[10px]">▾</span>
      </button>

      {/* La zone reste ouverte tant que la souris est dessus */}
      <div className="invisible absolute left-0 top-full z-50 w-52 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-xl border border-white/10 bg-noir-2 p-2 shadow-card">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-cream/80 hover:bg-white/5 hover:text-jaune"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
