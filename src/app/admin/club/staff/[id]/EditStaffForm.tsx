"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { modifierStaff } from "../../../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import type { Staff } from "@prisma/client";

export default function EditStaffForm({
  encadrant,
  teams,
}: {
  encadrant: Staff;
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(modifierStaff, null);
  const router = useRouter();

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="staffId" value={encadrant.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" className="input" defaultValue={encadrant.firstName} required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" className="input" defaultValue={encadrant.lastName} />
        </div>
        <div>
          <label className="label" htmlFor="role">Fonction</label>
          <input id="role" name="role" className="input" defaultValue={encadrant.role} required />
        </div>
        <div>
          <label className="label" htmlFor="teamId">Catégorie</label>
          <select id="teamId" name="teamId" className="input" defaultValue={encadrant.teamId ?? ""}>
            <option value="">Aucune catégorie</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField
            name="photo"
            defaultValue={encadrant.photo}
            prefix={`${encadrant.firstName}-${encadrant.lastName}`}
            ratio="portrait"
            label="Photo de l'encadrant"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SubmitButton>Enregistrer</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/club")} className="btn-ghost">
          Annuler
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
