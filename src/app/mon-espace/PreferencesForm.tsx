"use client";

import { useFormState } from "react-dom";
import { enregistrerPreferences } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import FormMessage from "@/components/FormMessage";

export default function PreferencesForm({
  teams,
  favoris,
  notifyMatches,
  notifyNews,
}: {
  teams: { id: string; name: string }[];
  favoris: string[];
  notifyMatches: boolean;
  notifyNews: boolean;
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

      <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="notifyMatches"
            defaultChecked={notifyMatches}
            className="h-4 w-4 accent-jaune"
          />
          <span className="text-sm">
            Me prévenir des <b>matchs</b> de mes catégories
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="notifyNews"
            defaultChecked={notifyNews}
            className="h-4 w-4 accent-jaune"
          />
          <span className="text-sm">
            Me prévenir des <b>actualités</b> du club
          </span>
        </label>
      </div>

      <div className="mt-6">
        <SubmitButton>Enregistrer mes préférences</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
