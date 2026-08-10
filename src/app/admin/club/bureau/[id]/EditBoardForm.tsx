"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { modifierMembreBureau } from "../../../actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";
import type { BoardMember } from "@prisma/client";

export default function EditBoardForm({ membre }: { membre: BoardMember }) {
  const [state, action] = useFormState(modifierMembreBureau, null);
  const router = useRouter();

  return (
    <form action={action} className="card mt-4">
      <input type="hidden" name="memberId" value={membre.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" className="input" defaultValue={membre.firstName} required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" className="input" defaultValue={membre.lastName} />
        </div>
        <div>
          <label className="label" htmlFor="role">Fonction</label>
          <input id="role" name="role" className="input" defaultValue={membre.role} required />
        </div>
        <div>
          <label className="label" htmlFor="group">Groupe</label>
          <select id="group" name="group" className="input" defaultValue={membre.group}>
            <option value="BUREAU">Le bureau</option>
            <option value="RESPONSABLE">Les responsables</option>
            <option value="COMITE">Le comité directeur</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="order">Ordre d&apos;affichage</label>
          <input id="order" name="order" type="number" className="input" defaultValue={membre.order} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PhotoField
            name="photo"
            defaultValue={membre.photo}
            prefix={`${membre.firstName}-${membre.lastName}`}
            ratio="portrait"
            label="Photo du membre"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SubmitButton>Enregistrer</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/club")} className="btn-ghost">
          Annuler
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
