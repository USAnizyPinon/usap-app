"use client";

import { useFormState } from "react-dom";
import { enregistrerPreferences } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

const FILTRES = [
  {
    name: "notifyMatches",
    titre: "Prochains matchs",
    detail: "Quand un match est programmé dans mes catégories",
  },
  {
    name: "notifyResults",
    titre: "Résultats",
    detail: "Quand le score d'un de mes matchs est publié",
  },
  {
    name: "notifyNews",
    titre: "Actualités du club",
    detail: "Les nouvelles publiées par le club",
  },
  {
    name: "notifyEvents",
    titre: "Événements",
    detail: "Loto, tournoi, assemblée générale…",
  },
] as const;

export default function PreferencesForm({
  teams,
  favoris,
  reglages,
}: {
  teams: { id: string; name: string }[];
  favoris: string[];
  reglages: Record<string, boolean>;
}) {
  const [state, action] = useFormState(enregistrerPreferences, null);

  return (
    <form action={action} className="card mt-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition hover:border-jaune/40"
          >
            <input
              type="checkbox"
              name="teams"
              value={t.id}
              defaultChecked={favoris.includes(t.id)}
              className="h-4 w-4 accent-jaune"
            />
            <span className="text-sm font-semibold">{t.name}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="label">Ce que je veux recevoir</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {FILTRES.map((f) => (
            <label
              key={f.name}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-4 py-3 transition hover:border-jaune/40"
            >
              <input
                type="checkbox"
                name={f.name}
                defaultChecked={reglages[f.name] ?? true}
                className="mt-0.5 h-4 w-4 accent-jaune"
              />
              <span>
                <span className="block text-sm font-semibold">{f.titre}</span>
                <span className="mt-0.5 block text-[11px] text-cream/50">{f.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton>Enregistrer mes préférences</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
