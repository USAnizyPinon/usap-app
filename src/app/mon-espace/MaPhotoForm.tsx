"use client";

import { useFormState } from "react-dom";
import { proposerPhoto, annulerPhoto } from "./photo-actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

export default function MaPhotoForm({
  photo,
  pendingPhoto,
}: {
  photo: string | null;
  pendingPhoto: string | null;
}) {
  const [state, action] = useFormState(proposerPhoto, null);

  if (pendingPhoto) {
    return (
      <div className="mt-5 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingPhoto}
            alt=""
            className="h-24 w-[72px] rounded-lg border-2 border-jaune/50 object-cover object-top"
          />
          <div>
            <span className="inline-block rounded-full border border-jaune/40 bg-jaune/10 px-3 py-1 text-xs font-bold text-jaune">
              En attente de validation
            </span>
            <p className="mt-2 max-w-sm text-sm text-cream/65">
              Un dirigeant doit valider cette photo avant qu&apos;elle remplace
              l&apos;actuelle sur le site.
            </p>
            <form action={annulerPhoto} className="mt-3">
              <button className="text-xs font-bold text-red-300 hover:text-red-200">
                Retirer ma proposition
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="mt-5 border-t border-white/10 pt-5">
      <p className="text-sm text-cream/70">
        {photo ? "Changer ma photo" : "Ajouter ma photo"} — elle sera visible sur la fiche
        de mon équipe après validation d&apos;un dirigeant.
      </p>

      <div className="mt-4">
        <PhotoField name="photo" ratio="portrait" label="Nouvelle photo" usage="demande" />
      </div>

      <div className="mt-4">
        <SubmitButton className="btn-ghost !py-2 text-xs">Envoyer pour validation</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
