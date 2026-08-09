import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, canEdit } from "@/lib/auth";
import SportCoricoCard from "@/components/SportCoricoCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace" };

const ROLE_LABEL: Record<string, string> = {
  LICENCIE: "Licencié",
  DIRIGEANT: "Dirigeant",
  ADMIN: "Administrateur",
};

export default async function MonEspacePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const editor = canEdit(session.user.role);

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Bonjour {session.user.name?.split(" ")[0]}</p>
      <h1 className="title mt-3">Mon espace</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-white/15 px-3 py-1 text-cream/70">
          {session.user.email}
        </span>
        <span className="rounded-full bg-jaune/15 px-3 py-1 font-bold text-jaune">
          {ROLE_LABEL[session.user.role] ?? "Licencié"}
        </span>
      </div>

      <div className="mt-10">
        <SportCoricoCard />
      </div>

      {editor ? (
        <div className="card mt-6">
          <p className="eyebrow">Gestion</p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase">
            Espace dirigeant
          </h2>
          <p className="mt-3 text-sm text-cream/70">
            Vous pouvez modifier le calendrier, les effectifs et les actualités du site.
          </p>
          <Link href="/admin" className="btn-jaune mt-5">
            Ouvrir la gestion
          </Link>
        </div>
      ) : (
        <div className="card mt-6">
          <p className="text-sm text-cream/70">
            Votre compte est en accès lecture. Pour obtenir les droits de gestion,
            demandez à un administrateur du club de vous passer en dirigeant.
          </p>
        </div>
      )}
    </div>
  );
}
