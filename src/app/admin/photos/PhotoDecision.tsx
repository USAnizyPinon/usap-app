"use client";

import { useFormState } from "react-dom";
import { accepterPhoto, refuserPhoto } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function PhotoDecision({ playerId }: { playerId: string }) {
  const [ok, actionOk] = useFormState(accepterPhoto, null);
  const [non, actionNon] = useFormState(refuserPhoto, null);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <form action={actionOk}>
          <input type="hidden" name="playerId" value={playerId} />
          <SubmitButton>Valider la photo</SubmitButton>
        </form>
        <form action={actionNon}>
          <input type="hidden" name="playerId" value={playerId} />
          <SubmitButton className="btn-ghost !border-red-400/40 !text-red-300">
            Refuser
          </SubmitButton>
        </form>
      </div>
      <FormMessage state={ok} />
      <FormMessage state={non} />
    </div>
  );
}
