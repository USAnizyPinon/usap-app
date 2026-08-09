"use client";

import { useFormState } from "react-dom";
import { publierActu } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

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
          <label className="label" htmlFor="image">Lien de l&apos;image (facultatif)</label>
          <input
            id="image"
            name="image"
            className="input"
            placeholder="https://usanizypinon.fr/photos/equipe.jpg"
          />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Publier</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
