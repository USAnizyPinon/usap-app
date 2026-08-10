"use client";

import { useFormState } from "react-dom";
import { ajouterLigneClassement } from "../actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function StandingForm({
  teamId,
  position,
}: {
  teamId: string;
  position: number;
}) {
  const [state, action] = useFormState(ajouterLigneClassement, null);

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="teamId" value={teamId} />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="label" htmlFor="position">Place</label>
          <input id="position" name="position" type="number" min={1} className="input" defaultValue={position} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="clubName">Club</label>
          <input id="clubName" name="clubName" className="input" placeholder="US Anizy-Pinon" required />
        </div>
        <div>
          <label className="label" htmlFor="played">Joués</label>
          <input id="played" name="played" type="number" min={0} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="won">Gagnés</label>
          <input id="won" name="won" type="number" min={0} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="drawn">Nuls</label>
          <input id="drawn" name="drawn" type="number" min={0} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="lost">Perdus</label>
          <input id="lost" name="lost" type="number" min={0} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="goalsFor">Buts pour</label>
          <input id="goalsFor" name="goalsFor" type="number" min={0} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="goalsAgainst">Buts contre</label>
          <input id="goalsAgainst" name="goalsAgainst" type="number" min={0} className="input" defaultValue={0} />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <input type="checkbox" name="isUsap" className="h-4 w-4 accent-jaune" />
        <span className="text-sm">C&apos;est notre équipe (surlignée en jaune)</span>
      </label>

      <div className="mt-4">
        <SubmitButton>Ajouter au classement</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
