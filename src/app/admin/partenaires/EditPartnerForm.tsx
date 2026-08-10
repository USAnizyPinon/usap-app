"use client";

import { useFormState } from "react-dom";
import { modifierPartenaire } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import type { Partner } from "@prisma/client";

export default function EditPartnerForm({ partenaire }: { partenaire: Partner }) {
  const [state, action] = useFormState(modifierPartenaire, null);

  return (
    <form action={action}>
      <input type="hidden" name="partnerId" value={partenaire.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Nom</label>
          <input name="name" className="input" defaultValue={partenaire.name} required />
        </div>
        <div>
          <label className="label">Site internet</label>
          <input name="website" className="input" defaultValue={partenaire.website ?? ""} />
        </div>
        <div>
          <label className="label">Niveau</label>
          <select name="tier" className="input" defaultValue={partenaire.tier}>
            <option value="PRINCIPAL">Partenaire principal</option>
            <option value="OFFICIEL">Partenaire officiel</option>
            <option value="SUPPORTER">Ils nous soutiennent</option>
          </select>
        </div>
        <div>
          <label className="label">Ordre</label>
          <input name="order" type="number" className="input" defaultValue={partenaire.order} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Description (fiche du partenaire)</label>
          <textarea name="description" rows={3} className="input" defaultValue={partenaire.description ?? ""} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Adresse (pour la carte)</label>
          <input name="address" className="input" placeholder="Intermarché, Anizy-le-Grand" defaultValue={partenaire.address ?? ""} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <PhotoField
            name="logo"
            defaultValue={partenaire.logo}
            prefix={partenaire.name}
            ratio="carre"
            label="Logo"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="visible" defaultChecked={partenaire.visible} className="h-4 w-4 accent-jaune" />
          <span className="text-xs">Visible sur le site</span>
        </label>
        <SubmitButton className="btn-ghost !py-2 text-xs">Enregistrer</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
