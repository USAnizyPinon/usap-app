"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { modifierJoueur } from "../../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import type { Player } from "@prisma/client";

export default function EditPlayerForm({
  joueur,
  teams,
}: {
  joueur: Player;
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(modifierJoueur, null);
  const router = useRouter();

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="playerId" value={joueur.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" className="input" defaultValue={joueur.firstName} required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" className="input" defaultValue={joueur.lastName} />
        </div>
        <div>
          <label className="label" htmlFor="teamId">Équipe</label>
          <select id="teamId" name="teamId" className="input" defaultValue={joueur.teamId}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="position">Poste</label>
          <input id="position" name="position" className="input" defaultValue={joueur.position ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="number">Numéro</label>
          <input id="number" name="number" type="number" min={1} max={99} className="input" defaultValue={joueur.number ?? ""} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField
            name="photo"
            defaultValue={joueur.photo}
            prefix={`${joueur.firstName}-${joueur.lastName}`}
            ratio="portrait"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SubmitButton>Enregistrer les modifications</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/effectif")} className="btn-ghost">
          Annuler
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
