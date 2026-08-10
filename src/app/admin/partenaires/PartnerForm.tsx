"use client";

import { useFormState } from "react-dom";
import { ajouterPartenaire } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function PartnerForm() {
  const [state, action] = useFormState(ajouterPartenaire, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="name">Nom</label>
          <input id="name" name="name" className="input" placeholder="Intermarché" required />
        </div>
        <div>
          <label className="label" htmlFor="website">Site internet (facultatif)</label>
          <input id="website" name="website" className="input" placeholder="https://…" />
        </div>
        <div>
          <label className="label" htmlFor="tier">Niveau</label>
          <select id="tier" name="tier" className="input" defaultValue="OFFICIEL">
            <option value="PRINCIPAL">Partenaire principal</option>
            <option value="OFFICIEL">Partenaire officiel</option>
            <option value="SUPPORTER">Ils nous soutiennent</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="order">Ordre</label>
          <input id="order" name="order" type="number" className="input" defaultValue={0} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <PhotoField name="logo" ratio="carre" label="Logo du partenaire" />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter le partenaire</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
