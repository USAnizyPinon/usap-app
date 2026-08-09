"use client";

import { useFormState } from "react-dom";
import { publierActu } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function NewsForm() {
  const [state, action] = useFormState(publierActu, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="Victoire des Seniors en coupe"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tag">Catégorie</label>
          <select id="tag" name="tag" className="input" defaultValue="Club">
            <option>Club</option>
            <option>Résultats</option>
            <option>Jeunes</option>
            <option>Féminines</option>
            <option>Événement</option>
            <option>Partenaires</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="excerpt">Résumé (affiché sur l&apos;accueil)</label>
          <textarea id="excerpt" name="excerpt" rows={2} className="input" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="body">Texte complet (facultatif)</label>
          <textarea id="body" name="body" rows={5} className="input" />
        </div>
        <div className="sm:col-span-2">
          <PhotoField name="image" ratio="paysage" label="Photo de l'actualité" />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input type="checkbox" name="notifier" defaultChecked className="h-4 w-4 accent-jaune" />
        <span className="text-sm">
          Envoyer une notification aux licenciés abonnés
        </span>
      </label>

      <div className="mt-5">
        <SubmitButton>Publier</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
