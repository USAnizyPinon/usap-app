"use client";

import { useFormState } from "react-dom";
import { enregistrerScore } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function ScoreForm({
  matchId,
  scoreFor,
  scoreAgainst,
}: {
  matchId: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
}) {
  const [state, action] = useFormState(enregistrerScore, null);

  return (
    <div>
      <form action={action} className="flex items-end gap-2">
        <input type="hidden" name="matchId" value={matchId} />
        <div className="w-20">
          <label className="label" htmlFor={`for-${matchId}`}>
            USAP
          </label>
          <input
            id={`for-${matchId}`}
            name="scoreFor"
            type="number"
            min={0}
            defaultValue={scoreFor ?? ""}
            className="input text-center"
          />
        </div>
        <span className="pb-2 text-cream/40">–</span>
        <div className="w-20">
          <label className="label" htmlFor={`ag-${matchId}`}>
            Adverse
          </label>
          <input
            id={`ag-${matchId}`}
            name="scoreAgainst"
            type="number"
            min={0}
            defaultValue={scoreAgainst ?? ""}
            className="input text-center"
          />
        </div>
        <SubmitButton className="btn-ghost !py-2">Enregistrer</SubmitButton>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
