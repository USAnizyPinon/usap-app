"use client";

import { useFormState } from "react-dom";
import { modifierEquipe } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import type { Team } from "@prisma/client";

export default function TeamForm({ team }: { team: Team }) {
  const [state, action] = useFormState(modifierEquipe, null);

  return (
    <form action={action} className="card mt-3">
      <input type="hidden" name="teamId" value={team.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">Jours d&apos;entraînement</label>
          <input
            name="trainDays"
            className="input"
            placeholder="Mardi & Jeudi"
            defaultValue={team.trainDays ?? ""}
          />
        </div>
        <div>
          <label className="label">Horaires</label>
          <input
            name="trainHours"
            className="input"
            placeholder="17h30-19h"
            defaultValue={team.trainHours ?? ""}
          />
        </div>
        <div>
          <label className="label">Stade</label>
          <input
            name="venue"
            className="input"
            placeholder="Stade de Pinon"
            defaultValue={team.venue ?? ""}
          />
        </div>
        <div>
          <label className="label">Années de naissance</label>
          <input
            name="birthYears"
            className="input"
            placeholder="2014-2015"
            defaultValue={team.birthYears ?? ""}
          />
        </div>
        <div>
          <label className="label">Date de reprise</label>
          <input
            name="restartDate"
            className="input"
            placeholder="Mardi 18 août"
            defaultValue={team.restartDate ?? ""}
          />
        </div>
        <div>
          <label className="label">Niveau</label>
          <input
            name="level"
            className="input"
            placeholder="Football à 8"
            defaultValue={team.level ?? ""}
          />
        </div>
        <div>
          <label className="label">Personne à contacter</label>
          <input
            name="contactName"
            className="input"
            defaultValue={team.contactName ?? ""}
          />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input
            name="contactTel"
            className="input"
            placeholder="06 12 34 56 78"
            defaultValue={team.contactTel ?? ""}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">Présentation de la catégorie</label>
          <textarea
            name="description"
            rows={2}
            className="input"
            defaultValue={team.description ?? ""}
          />
        </div>
      </div>

      <div className="mt-4">
        <SubmitButton className="btn-ghost !py-2 text-xs">Enregistrer</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
