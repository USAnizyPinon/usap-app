"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { modifierMatch } from "../../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import { toLocalInput } from "@/lib/format";
import type { Match } from "@prisma/client";

export default function EditMatchForm({
  match,
  teams,
}: {
  match: Match;
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(modifierMatch, null);
  const router = useRouter();

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="matchId" value={match.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="teamId">Équipe</label>
          <select id="teamId" name="teamId" className="input" defaultValue={match.teamId}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opponent">Adversaire</label>
          <input id="opponent" name="opponent" className="input" defaultValue={match.opponent} required />
        </div>
        <div>
          <label className="label" htmlFor="kickoff">Date et heure</label>
          <input
            id="kickoff"
            name="kickoff"
            type="datetime-local"
            className="input"
            defaultValue={toLocalInput(match.kickoff)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="home">Lieu</label>
          <select id="home" name="home" className="input" defaultValue={String(match.home)}>
            <option value="true">À domicile</option>
            <option value="false">À l&apos;extérieur</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="competition">Compétition</label>
          <select id="competition" name="competition" className="input" defaultValue={match.competition}>
            <option value="CHAMPIONNAT">Championnat</option>
            <option value="COUPE">Coupe</option>
            <option value="AMICAL">Amical</option>
            <option value="PLATEAU">Plateau</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="venue">Stade</label>
          <input id="venue" name="venue" className="input" defaultValue={match.venue ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="scoreFor">Score USAP</label>
          <input id="scoreFor" name="scoreFor" type="number" min={0} className="input" defaultValue={match.scoreFor ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="scoreAgainst">Score adverse</label>
          <input id="scoreAgainst" name="scoreAgainst" type="number" min={0} className="input" defaultValue={match.scoreAgainst ?? ""} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SubmitButton>Enregistrer les modifications</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/matchs")} className="btn-ghost">
          Annuler
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
