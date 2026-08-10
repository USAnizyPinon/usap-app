"use client";

import { useFormState } from "react-dom";
import { sInscrire, seDesinscrire } from "../admin/actions-plus";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function InscriptionForm({
  eventId,
  dejaInscrit,
  complet,
}: {
  eventId: string;
  dejaInscrit: number | null;
  complet: boolean;
}) {
  const [state, action] = useFormState(sInscrire, null);

  if (complet) {
    return <p className="text-sm text-red-300">Il n&apos;y a plus de place.</p>;
  }

  return (
    <div>
      {dejaInscrit !== null && (
        <p className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
          Vous êtes inscrit pour {dejaInscrit} personne{dejaInscrit > 1 ? "s" : ""}.
        </p>
      )}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="w-28">
          <label className="label" htmlFor={`nb-${eventId}`}>
            Personnes
          </label>
          <input
            id={`nb-${eventId}`}
            name="people"
            type="number"
            min={1}
            max={20}
            defaultValue={dejaInscrit ?? 1}
            className="input text-center"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="label" htmlFor={`cm-${eventId}`}>
            Remarque (facultatif)
          </label>
          <input
            id={`cm-${eventId}`}
            name="comment"
            className="input"
            placeholder="Allergie, arrivée tardive…"
          />
        </div>
        <SubmitButton>{dejaInscrit !== null ? "Modifier" : "Je m'inscris"}</SubmitButton>
      </form>

      {dejaInscrit !== null && (
        <form action={seDesinscrire} className="mt-3">
          <input type="hidden" name="eventId" value={eventId} />
          <button className="text-xs font-bold text-red-300 hover:text-red-200">
            Annuler mon inscription
          </button>
        </form>
      )}

      <FormMessage state={state} />
    </div>
  );
}
