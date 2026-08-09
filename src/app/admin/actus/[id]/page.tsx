import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditNewsForm from "./EditNewsForm";

export const dynamic = "force-dynamic";

export default async function ModifierActuPage({ params }: { params: { id: string } }) {
  const actu = await prisma.news.findUnique({ where: { id: params.id } });
  if (!actu) notFound();

  return (
    <div>
      <Link href="/admin/actus" className="text-xs font-bold text-jaune">
        ← Retour aux actualités
      </Link>
      <h2 className="mt-4 font-display text-xl font-black uppercase">
        Modifier l&apos;actualité
      </h2>
      <EditNewsForm actu={actu} />
    </div>
  );
}
