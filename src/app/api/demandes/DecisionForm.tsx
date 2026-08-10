"use client";

import { useFormState } from "react-dom";
import { accepterDemande, refuserDemande } from "../demandes-actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function DecisionForm({ requestId }: { requestId: string }) {
  const [accept, actionAccept] = useFormState(accepterDemande, null);
  const [refus, actionRefus] = useFormState(refuserDemande, null);

  return (
    <div className="flex flex-wrap items-end gap-4">
      <form action={actionAccept}>
        <input type="hidden" name="requestId" value={requestId} />
        <SubmitButton>Accepter</SubmitButton>
      </form>

      <form action={actionRefus} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <div className="min-w-[200px]">
          <label className="label" htmlFor={`r-${requestId}`}>
            Motif du refus (facultatif)
          </label>
          <input
            id={`r-${requestId}`}
            name="reason"
            className="input"
            placeholder="Licence non enregistrée…"
          />
        </div>
        <SubmitButton className="btn-ghost">Refuser</SubmitButton>
      </form>

      <div className="w-full">
        <FormMessage state={accept} />
        <FormMessage state={refus} />
      </div>
    </div>
  );
}
