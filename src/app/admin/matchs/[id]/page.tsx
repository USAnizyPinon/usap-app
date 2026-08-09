import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditMatchForm from "./EditMatchForm";

export const dynamic = "force-dynamic";

export default async function ModifierMatchPage({ params }: { params: { id: string } }) {
  const [match, teams] = await Promise.all([
    prisma.match.findUnique({ where: { id: params.id } }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!match) notFound();

  return (
    <div>
      <Link href="/admin/matchs" className="text-xs font-bold text-jaune">
        ← Retour aux matchs
      </Link>
      <h2 className="mt-4 font-display text-xl font-black uppercase">Modifier le match</h2>
      <EditMatchForm match={match} teams={teams} />
    </div>
  );
}
