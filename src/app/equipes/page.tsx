import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Équipes" };

export default async function EquipesPage() {
  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { players: true } } },
  });

  return (
    <div className="wrap py-12">
      <p className="eyebrow">Saison 2025 / 2026</p>
      <h1 className="title mt-3">Nos équipes</h1>

      {teams.length === 0 ? (
        <p className="card mt-8 text-sm text-cream/60">
          Aucune équipe enregistrée. Lance <code className="text-jaune">npm run db:seed</code>{" "}
          pour créer les catégories du club.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, i) => (
            <Link
              key={t.id}
              href={`/equipes/${t.slug}`}
              className="card group transition hover:border-jaune/50"
            >
              <span className="font-display text-xs font-black text-jaune">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 font-display text-2xl font-black uppercase leading-none group-hover:text-jaune">
                {t.name}
              </h2>
              <p className="mt-3 text-xs uppercase tracking-wider text-cream/50">
                {t.level ?? "Football"} · {t._count.players} joueur
                {t._count.players > 1 ? "s" : ""}
              </p>
              {t.venue && <p className="mt-1 text-xs text-cream/40">{t.venue}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
