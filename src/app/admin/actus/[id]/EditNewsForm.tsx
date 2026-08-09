"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { modifierActu } from "../../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import type { News } from "@prisma/client";

export default function EditNewsForm({ actu }: { actu: News }) {
  const [state, action] = useFormState(modifierActu, null);
  const router = useRouter();

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="newsId" value={actu.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">Titre</label>
          <input id="title" name="title" className="input" defaultValue={actu.title} required />
        </div>
        <div>
          <label className="label" htmlFor="tag">Catégorie</label>
          <select id="tag" name="tag" className="input" defaultValue={actu.tag}>
            <option>Club</option>
            <option>Résultats</option>
            <option>Jeunes</option>
            <option>Féminines</option>
            <option>Événement</option>
            <option>Partenaires</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="excerpt">Résumé</label>
          <textarea id="excerpt" name="excerpt" rows={2} className="input" defaultValue={actu.excerpt} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="body">Texte complet</label>
          <textarea id="body" name="body" rows={5} className="input" defaultValue={actu.body ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <PhotoField
            name="image"
            defaultValue={actu.image}
            prefix={actu.title}
            ratio="paysage"
            label="Photo de l'actualité"
          />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input type="checkbox" name="published" defaultChecked={actu.published} className="h-4 w-4 accent-jaune" />
        <span className="text-sm">Visible sur le site</span>
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <SubmitButton>Enregistrer les modifications</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/actus")} className="btn-ghost">
          Annuler
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
