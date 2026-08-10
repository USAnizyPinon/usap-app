import { prisma } from "@/lib/prisma";
import PartnerForm from "./PartnerForm";
import EditPartnerForm from "./EditPartnerForm";
import { supprimerPartenaire } from "../actions-plus";

export const dynamic = "force-dynamic";

export default async function AdminPartenairesPage() {
  const partenaires = await prisma.partner.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-black uppercase">Ajouter un partenaire</h2>
        <PartnerForm />
      </section>

      <section>
        <h2 className="font-display text-xl font-black uppercase">
          Les partenaires{" "}
          <span className="text-sm text-cream/40">({partenaires.length})</span>
        </h2>

        {partenaires.length === 0 ? (
          <p className="card mt-4 text-sm text-cream/60">Aucun partenaire.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {partenaires.map((p) => (
              <li key={p.id} className="card">
                <EditPartnerForm partenaire={p} />
                <form action={supprimerPartenaire} className="mt-3">
                  <input type="hidden" name="partnerId" value={p.id} />
                  <button className="text-xs font-bold text-red-300 hover:text-red-200">
                    Retirer ce partenaire
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
