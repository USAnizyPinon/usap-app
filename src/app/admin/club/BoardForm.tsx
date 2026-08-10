"use client";

import { useFormState } from "react-dom";
import { ajouterMembreBureau } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function BoardForm() {
  const [state, action] = useFormState(ajouterMembreBureau, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="bFirst">Prénom</label>
          <input id="bFirst" name="firstName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="bLast">Nom</label>
          <input id="bLast" name="lastName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="bRole">Fonction</label>
          <input id="bRole" name="role" className="input" placeholder="Présidente" required />
        </div>
        <div>
          <label className="label" htmlFor="bGroup">Groupe</label>
          <select id="bGroup" name="group" className="input" defaultValue="BUREAU">
            <option value="BUREAU">Le bureau</option>
            <option value="RESPONSABLE">Les responsables</option>
            <option value="COMITE">Le comité directeur</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="bOrder">Ordre d&apos;affichage</label>
          <input id="bOrder" name="order" type="number" className="input" defaultValue={0} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField name="photo" ratio="portrait" label="Photo du membre" />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter au bureau</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
