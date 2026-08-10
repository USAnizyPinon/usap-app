"use client";

import { useFormState } from "react-dom";
import { modifierLigneClassement } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import type { StandingRow } from "@prisma/client";

export default function RowForm({ ligne }: { ligne: StandingRow }) {
  const [state, action] = useFormState(modifierLigneClassement, null);

  return (
    <form action={action}>
      <input type="hidden" name="rowId" value={ligne.id} />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="label">Place</label>
          <input name="position" type="number" min={1} className="input" defaultValue={ligne.position} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Club</label>
          <input name="clubName" className="input" defaultValue={ligne.clubName} required />
        </div>
        <div>
          <label className="label">Joués</label>
          <input name="played" type="number" min={0} className="input" defaultValue={ligne.played} />
        </div>
        <div>
          <label className="label">Gagnés</label>
          <input name="won" type="number" min={0} className="input" defaultValue={ligne.won} />
        </div>
        <div>
          <label className="label">Nuls</label>
          <input name="drawn" type="number" min={0} className="input" defaultValue={ligne.drawn} />
        </div>
        <div>
          <label className="label">Perdus</label>
          <input name="lost" type="number" min={0} className="input" defaultValue={ligne.lost} />
        </div>
        <div>
          <label className="label">Buts pour</label>
          <input name="goalsFor" type="number" min={0} className="input" defaultValue={ligne.goalsFor} />
        </div>
        <div>
          <label className="label">Buts contre</label>
          <input name="goalsAgainst" type="number" min={0} className="input" defaultValue={ligne.goalsAgainst} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="isUsap" defaultChecked={ligne.isUsap} className="h-4 w-4 accent-jaune" />
          <span className="text-xs">Notre équipe</span>
        </label>
        <SubmitButton className="btn-ghost !py-2 text-xs">Enregistrer</SubmitButton>
        <span className="text-xs text-cream/45">
          {ligne.won * 3 + ligne.drawn} pts
        </span>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
