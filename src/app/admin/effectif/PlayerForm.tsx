"use client";

import { useFormState } from "react-dom";
import { ajouterJoueur } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function PlayerForm({ teams }: { teams: { id: string; name: string }[] }) {
  const [state, action] = useFormState(ajouterJoueur, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="playerTeam">Équipe</label>
          <select id="playerTeam" name="teamId" className="input" required>
            <option value="">Choisir…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="position">Poste (facultatif)</label>
          <input id="position" name="position" className="input" placeholder="Gardien" />
        </div>
        <div>
          <label className="label" htmlFor="number">Numéro (facultatif)</label>
          <input id="number" name="number" type="number" min={1} max={99} className="input" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField name="photo" ratio="portrait" label="Photo du joueur" />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter le joueur</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
