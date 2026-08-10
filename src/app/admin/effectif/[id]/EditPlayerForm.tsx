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
        <div>
          <label className="label" htmlFor="nameDisplay">Nom affiché publiquement</label>
          <select
            id="nameDisplay"
            name="nameDisplay"
            className="input"
            defaultValue={joueur.nameDisplay}
          >
            <option value="COMPLET">Prénom et nom</option>
            <option value="INITIALE">Prénom et initiale</option>
            <option value="PRENOM">Prénom seul</option>
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="publicPhoto"
              defaultChecked={joueur.publicPhoto}
              className="h-4 w-4 accent-jaune"
            />
            <span className="text-sm">Photo visible publiquement</span>
          </label>
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

      <div className="mt-6 rounded-xl border border-white/10 bg-noir-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jaune">
          Droit à l&apos;image
        </p>
        <p className="mt-1 text-xs text-cream/55">
          Ces réglages s&apos;appliquent aux pages publiques. Pour un mineur, l&apos;accord
          écrit des parents est nécessaire avant d&apos;afficher photo et nom.
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="publicPhoto"
            defaultChecked={joueur.publicPhoto}
            className="h-4 w-4 accent-jaune"
          />
          <span className="text-sm">Afficher la photo publiquement</span>
        </label>

        <div className="mt-4 max-w-xs">
          <label className="label" htmlFor="nameDisplay">Nom affiché</label>
          <select
            id="nameDisplay"
            name="nameDisplay"
            className="input"
            defaultValue={joueur.nameDisplay}
          >
            <option value="COMPLET">
              Prénom et nom ({joueur.firstName} {joueur.lastName})
            </option>
            <option value="INITIALE">
              Prénom et initiale ({joueur.firstName} {joueur.lastName.charAt(0)}.)
            </option>
            <option value="PRENOM">Prénom seul ({joueur.firstName})</option>
          </select>
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
