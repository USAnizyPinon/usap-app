"use client";

import { useFormState } from "react-dom";
import { creerMatch } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function MatchForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(creerMatch, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="teamId">
            Équipe
          </label>
          <select id="teamId" name="teamId" className="input" required>
            <option value="">Choisir…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="opponent">
            Adversaire
          </label>
          <input
            id="opponent"
            name="opponent"
            className="input"
            placeholder="Vic-sur-Aisne"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="kickoff">
            Date et heure
          </label>
          <input id="kickoff" name="kickoff" type="datetime-local" className="input" required />
        </div>

        <div>
          <label className="label" htmlFor="home">
            Lieu
          </label>
          <select id="home" name="home" className="input" defaultValue="true">
            <option value="true">À domicile</option>
            <option value="false">À l&apos;extérieur</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="competition">
            Compétition
          </label>
          <select id="competition" name="competition" className="input" defaultValue="CHAMPIONNAT">
            <option value="CHAMPIONNAT">Championnat</option>
            <option value="COUPE">Coupe</option>
            <option value="AMICAL">Amical</option>
            <option value="PLATEAU">Plateau</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="venue">
            Stade (facultatif)
          </label>
          <input id="venue" name="venue" className="input" placeholder="Stade de Pinon" />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Ajouter le match</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
