import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, canEdit } from "@/lib/auth";

export const metadata = { title: "Espace dirigeant" };

const TABS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/matchs", label: "Matchs" },
  { href: "/admin/effectif", label: "Effectifs" },
  { href: "/admin/equipes", label: "Créneaux" },
  { href: "/admin/categories", label: "Entraînements" },
  { href: "/admin/actus", label: "Actualités" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/classement", label: "Classement" },
  { href: "/admin/evenements", label: "Événements" },
  { href: "/admin/galerie", label: "Galerie" },
  { href: "/admin/partenaires", label: "Partenaires" },
  { href: "/admin/club", label: "Bureaux & staff" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  // Garde-fou : un licencie simple n'entre pas dans l'espace de gestion.
  if (!canEdit(session.user.role)) {
    return (
      <div className="wrap py-20 text-center">
        <p className="eyebrow justify-center">Accès refusé</p>
        <h1 className="title mt-4">Espace réservé aux dirigeants</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-cream/65">
          Votre compte n&apos;a pas les droits de gestion. Demandez à un administrateur du
          club de vous passer en dirigeant.
        </p>
        <Link href="/" className="btn-jaune mt-8">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Espace dirigeant</p>
      <h1 className="title mt-3">Gestion du club</h1>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-bold text-cream/75 transition hover:border-jaune hover:text-jaune"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
