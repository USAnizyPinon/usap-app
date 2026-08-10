"use client";

import { useFormState } from "react-dom";
import { ajouterPhoto } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function PhotoUploadForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(ajouterPhoto, null);

  return (
    <form action={action} className="card mt-4">
      <PhotoField name="url" ratio="paysage" label="Photo" />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="caption">Légende (facultatif)</label>
          <input
            id="caption"
            name="caption"
            className="input"
            placeholder="Victoire en coupe contre Vic-sur-Aisne"
          />
        </div>
        <div>
          <label className="label" htmlFor="season">Saison</label>
          <input id="season" name="season" className="input" defaultValue="2025/2026" />
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="teamId">Catégorie (facultatif)</label>
          <select id="teamId" name="teamId" className="input" defaultValue="">
            <option value="">Aucune</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter à la galerie</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
