import { prisma } from "@/lib/prisma";
import TeamForm from "./TeamForm";

export const dynamic = "force-dynamic";

export default async function AdminEquipesPage() {
  const teams = await prisma.team.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="font-display text-xl font-black uppercase">
          Créneaux et contacts
        </h2>
        <p className="mt-2 text-sm text-cream/70">
          Ces informations s&apos;affichent sur la page <b>Nous rejoindre</b> et sur la
          fiche de chaque équipe. Le numéro de téléphone n&apos;est visible que par les
          personnes connectées.
        </p>
      </div>

      {teams.map((t) => (
        <section key={t.id}>
          <h3 className="font-display text-lg font-black uppercase">{t.name}</h3>
          <TeamForm team={t} />
        </section>
      ))}
    </div>
  );
}
