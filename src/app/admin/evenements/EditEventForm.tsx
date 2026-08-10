"use client";

import { useFormState } from "react-dom";
import { modifierEvenement } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import { toLocalInput } from "@/lib/format";
import type { Event } from "@prisma/client";

export default function EditEventForm({ evenement }: { evenement: Event }) {
  const [state, action] = useFormState(modifierEvenement, null);

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={evenement.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nom</label>
          <input name="title" className="input" defaultValue={evenement.title} required />
        </div>
        <div>
          <label className="label">Date et heure</label>
          <input
            name="startsAt"
            type="datetime-local"
            className="input"
            defaultValue={toLocalInput(evenement.startsAt)}
            required
          />
        </div>
        <div>
          <label className="label">Lieu</label>
          <input name="place" className="input" defaultValue={evenement.place ?? ""} />
        </div>
        <div>
          <label className="label">Places</label>
          <input name="capacity" type="number" min={1} className="input" defaultValue={evenement.capacity ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={4} className="input" defaultValue={evenement.description ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <PhotoField
            name="image"
            defaultValue={evenement.image}
            prefix={evenement.title}
            ratio="paysage"
            label="Affiche"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="openToSignup" defaultChecked={evenement.openToSignup} className="h-4 w-4 accent-jaune" />
          <span className="text-sm">Inscriptions ouvertes</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="published" defaultChecked={evenement.published} className="h-4 w-4 accent-jaune" />
          <span className="text-sm">Visible sur le site</span>
        </label>
      </div>

      <div className="mt-4">
        <SubmitButton className="btn-ghost !py-2 text-xs">Enregistrer</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
