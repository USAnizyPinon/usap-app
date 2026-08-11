"use client";

import { useFormState } from "react-dom";
import { viderCalendrier } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function ViderCalendrier({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(viderCalendrier, null);

  return (
    <details className="card mt-4">
      <summary className="cursor-pointer text-sm font-bold text-red-300">
        Vider le calendrier d&apos;une catégorie
      </summary>

      <p className="mt-3 text-xs text-cream/60">
        Supprime tous les matchs de la catégorie choisie, sauf ceux dont le score est déjà
        saisi. Utile pour refaire un import.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <label className="label" htmlFor="videTeam">Catégorie</label>
          <select id="videTeam" name="teamId" className="input" required>
            <option value="">Choisir…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <SubmitButton className="btn-ghost !border-red-400/40 !text-red-300">
          Vider
        </SubmitButton>
      </form>
      <FormMessage state={state} />
    </details>
  );
}
