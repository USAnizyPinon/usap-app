"use client";

import { useFormState } from "react-dom";
import { envoyerDemande, annulerDemande } from "../admin/demandes-actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";
import PhotoField from "@/components/PhotoField";

type Demande = {
  status: string;
  reason: string | null;
  supporter: boolean;
  firstName: string;
  lastName: string;
  photo: string | null;
  teamId: string | null;
  message: string | null;
  team: { name: string } | null;
};

export default function RejoindreForm({
  teams,
  demande,
  nomParDefaut,
}: {
  teams: { id: string; name: string }[];
  demande: Demande | null;
  nomParDefaut: { prenom: string; nom: string };
}) {
  const [state, action] = useFormState(envoyerDemande, null);

  // --- Demande en cours d'examen ---
  if (demande?.status === "EN_ATTENTE") {
    return (
      <div className="card">
        <span className="inline-block rounded-full border border-jaune/40 bg-jaune/10 px-3 py-1 text-xs font-bold text-jaune">
          En attente de validation
        </span>
        <p className="mt-4 text-sm text-cream/75">
          Votre demande a bien été envoyée
          {demande.supporter
            ? " comme supporter"
            : demande.team
              ? ` pour la catégorie ${demande.team.name}`
              : ""}
          . Un dirigeant du club va la vérifier, vous recevrez une réponse ici.
        </p>
        <form action={annulerDemande} className="mt-4">
          <button className="text-xs font-bold text-red-300 hover:text-red-200">
            Annuler ma demande
          </button>
        </form>
      </div>
    );
  }

  // --- Demande refusee : on explique et on permet de refaire ---
  const refusee = demande?.status === "REFUSEE";

  return (
    <form action={action} className="card">
      {refusee && (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          Votre demande précédente n&apos;a pas été retenue
          {demande?.reason ? ` : ${demande.reason}` : "."} Vous pouvez la corriger et la
          renvoyer.
        </div>
      )}

      <p className="text-sm text-cream/70">
        Indiquez qui vous êtes et ce que vous faites au club. Un dirigeant valide ensuite
        votre demande : une fois acceptée, vous apparaissez dans l&apos;effectif de votre
        catégorie.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input
            id="firstName"
            name="firstName"
            className="input"
            defaultValue={demande?.firstName || nomParDefaut.prenom}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input
            id="lastName"
            name="lastName"
            className="input"
            defaultValue={demande?.lastName || nomParDefaut.nom}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="choix">Je suis…</label>
          <select
            id="choix"
            name="choix"
            className="input"
            defaultValue={demande?.supporter ? "supporter" : (demande?.teamId ?? "")}
            required
          >
            <option value="">Choisir…</option>
            <optgroup label="Joueur / joueuse">
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="Autre">
              <option value="supporter">Supporter du club</option>
            </optgroup>
          </select>
        </div>

        <div className="sm:col-span-2">
          <PhotoField
            name="photo"
            defaultValue={demande?.photo}
            ratio="portrait"
            label="Ma photo (facultatif)"
            usage="demande"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="message">Message au club (facultatif)</label>
          <textarea
            id="message"
            name="message"
            rows={2}
            className="input"
            placeholder="Numéro de licence, poste habituel…"
            defaultValue={demande?.message ?? ""}
          />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton>Envoyer ma demande</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
