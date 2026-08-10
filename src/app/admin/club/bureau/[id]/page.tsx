import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditBoardForm from "./EditBoardForm";

export const dynamic = "force-dynamic";

export default async function ModifierMembrePage({ params }: { params: { id: string } }) {
  const membre = await prisma.boardMember.findUnique({ where: { id: params.id } });
  if (!membre) notFound();

  return (
    <div>
      <Link href="/admin/club" className="text-xs font-bold text-jaune">
        ← Retour au bureau
      </Link>
      <h2 className="mt-4 font-display text-xl font-black uppercase">Modifier le membre</h2>
      <EditBoardForm membre={membre} />
    </div>
  );
}
