import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditStaffForm from "./EditStaffForm";

export const dynamic = "force-dynamic";

export default async function ModifierStaffPage({ params }: { params: { id: string } }) {
  const [encadrant, teams] = await Promise.all([
    prisma.staff.findUnique({ where: { id: params.id } }),
    prisma.team.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!encadrant) notFound();

  return (
    <div>
      <Link href="/admin/club" className="text-xs font-bold text-jaune">
        ← Retour à l&apos;encadrement
      </Link>
      <h2 className="mt-4 font-display text-xl font-black uppercase">
        Modifier l&apos;encadrant
      </h2>
      <EditStaffForm encadrant={encadrant} teams={teams} />
    </div>
  );
}
