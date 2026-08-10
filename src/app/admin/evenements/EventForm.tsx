"use client";

import { useFormState } from "react-dom";
import { creerEvenement } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function EventForm() {
  const [state, action] = useFormState(creerEvenement, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">Nom de l&apos;événement</label>
          <input id="title" name="title" className="input" placeholder="Loto du club" required />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">Date et heure</label>
          <input id="startsAt" name="startsAt" type="datetime-local" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="place">Lieu</label>
          <input id="place" name="place" className="input" placeholder="Salle des fêtes d'Anizy" />
        </div>
        <div>
          <label className="label" htmlFor="capacity">Places (vide = illimité)</label>
          <input id="capacity" name="capacity" type="number" min={1} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} className="input" />
        </div>
        <div className="sm:col-span-2">
          <PhotoField name="image" ratio="paysage" label="Affiche de l'événement" />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="openToSignup" defaultChecked className="h-4 w-4 accent-jaune" />
          <span className="text-sm">Ouvrir les inscriptions</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="notifier" defaultChecked className="h-4 w-4 accent-jaune" />
          <span className="text-sm">Prévenir les licenciés abonnés</span>
        </label>
      </div>

      <div className="mt-5">
        <SubmitButton>Créer l&apos;événement</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
