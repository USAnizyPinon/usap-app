import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditPlayerForm from "./EditPlayerForm";

export const dynamic = "force-dynamic";

export default async function ModifierJoueurPage({ params }: { params: { id: string } }) {
  const [joueur, teams] = await Promise.all([
    prisma.player.findUnique({ where: { id: params.id } }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!joueur) notFound();

  return (
    <div>
      <Link href="/admin/effectif" className="text-xs font-bold text-jaune">
        ← Retour aux effectifs
      </Link>
      <h2 className="mt-4 font-display text-xl font-black uppercase">Modifier le joueur</h2>
      <EditPlayerForm joueur={joueur} teams={teams} />
    </div>
  );
}
