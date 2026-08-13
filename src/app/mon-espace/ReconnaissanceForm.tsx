"use client";

import { useFormState } from "react-dom";
import { rattacherAFiche } from "../admin/demandes-actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export type FicheTrouvee = {
  id: string;
  nom: string;
  equipe: string;
  photo: string | null;
};

/**
 * Proposé quand une fiche au même nom existe déjà dans l'effectif :
 * on relie le compte plutôt que de créer un doublon.
 */
export default function ReconnaissanceForm({ fiches }: { fiches: FicheTrouvee[] }) {
  const [state, action] = useFormState(rattacherAFiche, null);

  if (fiches.length === 0) return null;

  return (
    <div className="card border-jaune/40">
      <p className="eyebrow">Nous vous avons trouvé</p>
      <h3 className="mt-3 font-display text-xl font-black uppercase">
        Vous êtes déjà dans l&apos;effectif ?
      </h3>
      <p className="mt-2 text-sm text-cream/70">
        Une fiche à votre nom existe déjà. Reliez-la à votre compte : inutile de refaire une
        demande.
      </p>

      <ul className="mt-5 space-y-3">
        {fiches.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-4 rounded-xl bg-noir-3 p-4">
            {f.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.photo}
                alt=""
                className="h-16 w-12 rounded-lg object-cover object-top"
              />
            ) : (
              <div className="grid h-16 w-12 place-items-center rounded-lg border border-white/10 text-[10px] text-cream/30">
                Sans<br />photo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold">{f.nom}</p>
              <p className="text-xs text-cream/45">{f.equipe}</p>
            </div>
            <form action={action}>
              <input type="hidden" name="playerId" value={f.id} />
              <SubmitButton className="btn-jaune !py-2 text-xs">C&apos;est moi</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <FormMessage state={state} />
      <p className="mt-4 text-xs text-cream/45">
        Ce n&apos;est pas vous ? Remplissez simplement le formulaire ci-dessous.
      </p>
    </div>
  );
}
