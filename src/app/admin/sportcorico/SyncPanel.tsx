"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ligne = {
  equipe: string;
  quand: string;
  adversaire: string;
  score: string;
  etat: "cree" | "maj" | "identique" | "verrouille";
  changements: string[];
  notifie?: number;
};

type Rapport = {
  test: boolean;
  equipes: {
    nom: string;
    url: string;
    equipeSportCorico?: string;
    erreur?: string;
    matchsLus: number;
    joues: number;
  }[];
  lignes: Ligne[];
  crees: number;
  modifies: number;
  notifications: number;
  error?: string;
};

const ETAT: Record<Ligne["etat"], { texte: string; classe: string }> = {
  cree: { texte: "ajouté", classe: "text-sky-300" },
  maj: { texte: "mis à jour", classe: "text-emerald-300" },
  identique: { texte: "déjà à jour", classe: "text-cream/40" },
  verrouille: { texte: "saisi à la main", classe: "text-jaune" },
};

/**
 * Deux boutons : relire sans rien changer, ou relire et enregistrer.
 * Le mode test sert a verifier ce qui serait fait avant de laisser la
 * synchronisation tourner seule.
 */
export default function SyncPanel({ actif }: { actif: boolean }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState<"test" | "vrai" | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [toutVoir, setToutVoir] = useState(false);

  async function lancer(mode: "test" | "vrai") {
    setOccupe(mode);
    setRapport(null);
    setToutVoir(false);
    try {
      const r = await fetch(`/api/cron/sportcorico${mode === "test" ? "?test=1" : ""}`, {
        cache: "no-store",
      });
      const data = (await r.json()) as Rapport;
      setRapport(data);
      if (mode === "vrai" && data.crees + data.modifies > 0) router.refresh();
    } catch {
      setRapport({
        test: mode === "test",
        equipes: [],
        lignes: [],
        crees: 0,
        modifies: 0,
        notifications: 0,
        error: "La requête n'a pas abouti. Réessayez dans un instant.",
      });
    } finally {
      setOccupe(null);
    }
  }

  return (
    <section>
      <h3 className="font-display text-lg font-black uppercase">Relire maintenant</h3>

      <div className="card mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => lancer("test")}
          disabled={!actif || occupe !== null}
          className="btn-ghost !py-2 disabled:opacity-40"
        >
          {occupe === "test" ? "Lecture…" : "Tester sans enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => lancer("vrai")}
          disabled={!actif || occupe !== null}
          className="btn-jaune !py-2 disabled:opacity-40"
        >
          {occupe === "vrai" ? "Synchronisation…" : "Synchroniser maintenant"}
        </button>
        <span className="text-xs text-cream/45">
          {actif
            ? "Commencez par le test : il montre ce qui serait fait sans rien modifier."
            : "Reliez d'abord une catégorie à sa page SportCorico."}
        </span>
      </div>

      {rapport && (
        <Resultat rapport={rapport} toutVoir={toutVoir} setToutVoir={setToutVoir} />
      )}
    </section>
  );
}

function Resultat({
  rapport,
  toutVoir,
  setToutVoir,
}: {
  rapport: Rapport;
  toutVoir: boolean;
  setToutVoir: (v: boolean) => void;
}) {
  if (rapport.error) {
    return (
      <p className="card mt-4 border-red-400/30 bg-red-500/10 text-sm text-red-200">
        {rapport.error}
      </p>
    );
  }

  const aFaire = rapport.lignes.filter((l) => l.etat !== "identique");
  const visibles = toutVoir ? rapport.lignes : aFaire;
  const verbe = rapport.test ? "seraient" : "ont été";

  return (
    <div className="mt-4 space-y-4">
      <div className="card">
        <p className="font-bold">
          {rapport.crees} match(s) {rapport.test ? "seraient ajoutés" : "ajoutés"},{" "}
          {rapport.modifies} {verbe} mis à jour.
          {!rapport.test && rapport.notifications > 0 && (
            <> {rapport.notifications} notification(s) envoyée(s).</>
          )}
        </p>
        {rapport.test && (
          <p className="mt-1 text-xs text-cream/50">
            Rien n&apos;a été modifié. Vérifiez les lignes ci-dessous, puis lancez la
            synchronisation.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rapport.equipes.map((e) => (
          <div key={e.url} className="card">
            <p className="font-bold">{e.nom}</p>
            {e.erreur ? (
              <p className="mt-1 text-sm text-red-300">{e.erreur}</p>
            ) : (
              <p className="mt-1 text-xs text-cream/50">
                {e.equipeSportCorico && <>« {e.equipeSportCorico} » · </>}
                {e.matchsLus} match(s) au calendrier, {e.joues} joué(s).
              </p>
            )}
          </div>
        ))}
      </div>

      {rapport.lignes.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-cream/45">
              {toutVoir
                ? `${rapport.lignes.length} match(s) lus`
                : `${aFaire.length} match(s) concernés`}
            </p>
            <button
              type="button"
              onClick={() => setToutVoir(!toutVoir)}
              className="text-xs font-bold text-jaune hover:underline"
            >
              {toutVoir ? "Ne montrer que les changements" : "Voir tout le calendrier"}
            </button>
          </div>

          {visibles.length === 0 ? (
            <p className="text-sm text-cream/60">
              Tout est déjà à jour, rien à faire.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-cream/45">
                  <th className="pb-2 pr-4 font-semibold">Coup d&apos;envoi</th>
                  <th className="pb-2 pr-4 font-semibold">Catégorie</th>
                  <th className="pb-2 pr-4 font-semibold">Adversaire</th>
                  <th className="pb-2 pr-4 font-semibold">Score</th>
                  <th className="pb-2 font-semibold">Ce qui change</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((l, i) => (
                  <tr key={`${l.quand}-${l.equipe}-${i}`} className="border-t border-white/10">
                    <td className="whitespace-nowrap py-2 pr-4 text-cream/70">{l.quand}</td>
                    <td className="py-2 pr-4 text-cream/70">{l.equipe}</td>
                    <td className="py-2 pr-4 text-cream/70">{l.adversaire}</td>
                    <td className="whitespace-nowrap py-2 pr-4 font-bold">{l.score}</td>
                    <td className="py-2 text-xs">
                      <span className={`font-semibold ${ETAT[l.etat].classe}`}>
                        {ETAT[l.etat].texte}
                      </span>
                      {l.changements.length > 0 && (
                        <span className="text-cream/50"> · {l.changements.join(", ")}</span>
                      )}
                      {l.notifie ? (
                        <span className="text-cream/50"> · {l.notifie} prévenu(s)</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
