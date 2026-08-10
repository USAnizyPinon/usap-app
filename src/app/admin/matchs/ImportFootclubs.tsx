"use client";

import { useRef, useState, useTransition } from "react";
import { importerCalendrier, type MatchAImporter } from "../actions";
import { deviner, lireExtraction, type LigneMatch } from "@/lib/footclubs";
import { formatDateTime } from "@/lib/format";

export default function ImportFootclubs({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [teamId, setTeamId] = useState("");
  const [lignes, setLignes] = useState<LigneMatch[] | null>(null);
  const [nomFichier, setNomFichier] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  /** Le fichier Footclubs n'est pas toujours en UTF-8 : on essaie les deux. */
  async function lireFichier(file: File) {
    const buffer = await file.arrayBuffer();
    let texte = new TextDecoder("utf-8").decode(buffer);
    // Le caractere de remplacement signale un mauvais encodage
    if (texte.includes("\uFFFD")) {
      texte = new TextDecoder("windows-1252").decode(buffer);
    }
    return texte;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setNomFichier(file.name);

    try {
      const texte = await lireFichier(file);
      const resultat = lireExtraction(texte);

      if (resultat.length === 0) {
        setLignes(null);
        setMessage({
          ok: false,
          texte:
            "Aucune rencontre trouvée. Vérifiez que le fichier est bien l'extraction des rencontres, enregistrée au format CSV.",
        });
        return;
      }
      setLignes(resultat);
    } catch {
      setMessage({ ok: false, texte: "Fichier illisible." });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const valides = (lignes ?? []).filter((l) => !l.erreur);
  const rejetees = (lignes ?? []).filter((l) => l.erreur);

  function importer() {
    if (!teamId) {
      setMessage({ ok: false, texte: "Choisissez d'abord la catégorie." });
      return;
    }

    const charge: MatchAImporter[] = valides.map((l) => ({
      kickoff: (l.date as Date).toISOString(),
      opponent: l.adversaire,
      home: l.aDomicile,
      competition: deviner(l.competition),
      venue: l.terrain || null,
    }));

    start(async () => {
      const res = await importerCalendrier(teamId, charge);
      setMessage({ ok: res.ok, texte: res.message });
      if (res.ok) setLignes(null);
    });
  }

  return (
    <div className="card mt-4">
      <details className="group">
        <summary className="cursor-pointer text-sm font-bold text-jaune">
          Où trouver le fichier dans Footclubs ?
        </summary>
        <ol className="mt-3 space-y-1 text-xs text-cream/65">
          <li>1. Connectez-vous à Footclubs avec les identifiants du club.</li>
          <li>
            2. Menu <b>Compétitions</b> puis <b>Éditions et extractions</b>.
          </li>
          <li>3. Choisissez l&apos;extraction des rencontres et vos équipes.</li>
          <li>
            4. Enregistrez le fichier au format <b>CSV</b>, puis déposez-le ici.
          </li>
        </ol>
      </details>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="importTeam">
            Catégorie concernée
          </label>
          <select
            id="importTeam"
            className="input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Choisir…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="label">Fichier d&apos;extraction</span>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="btn-ghost w-full !py-2.5"
          >
            {nomFichier || "Choisir un fichier CSV"}
          </button>
          <input
            ref={input}
            type="file"
            accept=".csv,.txt,text/csv"
            onChange={onFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Aperçu avant validation : rien n'est enregistré tant qu'on ne confirme pas */}
      {lignes && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-sm font-bold">
            {valides.length} rencontre{valides.length > 1 ? "s" : ""} prête
            {valides.length > 1 ? "s" : ""} à importer
            {rejetees.length > 0 && (
              <span className="ml-2 text-xs font-normal text-red-300">
                ({rejetees.length} ignorée{rejetees.length > 1 ? "s" : ""})
              </span>
            )}
          </p>

          <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <tbody>
                {valides.map((l) => (
                  <tr key={l.ligne} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 capitalize text-cream/60">
                      {formatDateTime(l.date as Date)}
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {l.aDomicile ? "Reçoit" : "Se déplace à"} {l.adversaire}
                    </td>
                    <td className="px-3 py-2 text-cream/45">{l.competition}</td>
                  </tr>
                ))}
                {rejetees.map((l) => (
                  <tr key={l.ligne} className="border-b border-white/5 bg-red-500/5">
                    <td className="px-3 py-2 text-red-300" colSpan={3}>
                      Ligne {l.ligne} — {l.erreur} ({l.domicile} / {l.exterieur})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={importer}
              disabled={pending || valides.length === 0}
              className="btn-jaune"
            >
              {pending ? "Import…" : `Importer ${valides.length} match(s)`}
            </button>
            <button
              onClick={() => {
                setLignes(null);
                setNomFichier("");
              }}
              className="btn-ghost"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
            message.ok
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-400/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.texte}
        </p>
      )}
    </div>
  );
}
