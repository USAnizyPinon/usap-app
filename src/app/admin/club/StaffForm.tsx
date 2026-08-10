"use client";

import { useFormState } from "react-dom";
import { ajouterStaff } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function StaffForm({ teams }: { teams: { id: string; name: string }[] }) {
  const [state, action] = useFormState(ajouterStaff, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="sFirst">Prénom</label>
          <input id="sFirst" name="firstName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="sLast">Nom</label>
          <input id="sLast" name="lastName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="sRole">Fonction</label>
          <select id="sRole" name="role" className="input" defaultValue="Éducateur">
            <option>Éducateur</option>
            <option>Éducatrice</option>
            <option>Entraîneur</option>
            <option>Entraîneur adjoint</option>
            <option>Dirigeant d&apos;équipe</option>
            <option>Gardien de but</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sTeam">Catégorie</label>
          <select id="sTeam" name="teamId" className="input" defaultValue="">
            <option value="">Aucune catégorie</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField name="photo" ratio="portrait" label="Photo de l'encadrant" />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter à l&apos;encadrement</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
