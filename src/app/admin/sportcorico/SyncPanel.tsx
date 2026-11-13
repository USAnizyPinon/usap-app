"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ligne = {
  equipe: string;
  jour: string;
  adversaire: string;
  score: string;
  etat: "ecrit" | "identique" | "verrouille" | "inconnu";
  notifie?: number;
  extrait?: string;
};

type Rapport = {
  test: boolean;
  equipes: {
    nom: string;
    url: string;
    erreur?: string;
    datesVues: number;
    matchsLus: number;
    apercu?: string;
  }[];
  lignes: Ligne[];
  ecrits: number;
  notifications: number;
  error?: string;
};

const ETAT: Record<Ligne["etat"], { texte: string; classe: string }> = {
  ecrit: { texte: "enregistré", classe: "text-emerald-300" },
  identique: { texte: "déjà à jour", classe: "text-cream/45" },
  verrouille: { texte: "saisi à la main", classe: "text-jaune" },
  inconnu: { texte: "match absent du calendrier", classe: "text-orange-300" },
};

/**
 * Deux boutons : relire sans rien changer, ou relire et enregistrer.
 * Le mode test sert a verifier que les scores sont lus correctement avant de
 * laisser la synchronisation tourner seule.
 */
export default function SyncPanel({ actif }: { actif: boolean }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState<"test" | "vrai" | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);

  async function lancer(mode: "test" | "vrai") {
    setOccupe(mode);
    setRapport(null);
    try {
      const r = await fetch(`/api/cron/sportcorico${mode === "test" ? "?test=1" : ""}`, {
        cache: "no-store",
      });
      const data = (await r.json()) as Rapport;
      setRapport(data);
      if (mode === "vrai" && data.ecrits > 0) router.refresh();
    } catch {
      setRapport({
        test: mode === "test",
        equipes: [],
        lignes: [],
        ecrits: 0,
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
            ? "Commencez par le test : il montre ce qui serait écrit sans rien modifier."
            : "Reliez d'abord une catégorie à sa page SportCorico."}
        </span>
      </div>

      {rapport && <Resultat rapport={rapport} />}
    </section>
  );
}

function Resultat({ rapport }: { rapport: Rapport }) {
  if (rapport.error) {
    return (
      <p className="card mt-4 border-red-400/30 bg-red-500/10 text-sm text-red-200">
        {rapport.error}
      </p>
    );
  }

  const aEcrire = rapport.lignes.filter((l) => l.etat === "ecrit").length;

  return (
    <div className="mt-4 space-y-4">
      <div className="card">
        <p className="font-bold">
          {rapport.test
            ? `${aEcrire} score(s) seraient enregistrés.`
            : `${rapport.ecrits} score(s) enregistrés.`}
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

      {rapport.equipes.map((e) => (
        <div key={e.url} className="card">
          <p className="font-bold">{e.nom}</p>
          {e.erreur ? (
            <p className="mt-1 text-sm text-red-300">{e.erreur}</p>
          ) : (
            <p className="mt-1 text-xs text-cream/50">
              {e.matchsLus} match(s) joué(s) lu(s) sur {e.datesVues} date(s) trouvée(s).
            </p>
          )}
          {e.apercu && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-cream/45">
                Voir ce qui a été lu sur la page
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-cream/60">
                {e.apercu}
              </pre>
            </details>
          )}
        </div>
      ))}

      {rapport.lignes.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-cream/45">
                <th className="pb-2 pr-4 font-semibold">Date</th>
                <th className="pb-2 pr-4 font-semibold">Catégorie</th>
                <th className="pb-2 pr-4 font-semibold">Score lu</th>
                <th className="pb-2 pr-4 font-semibold">Adversaire</th>
                <th className="pb-2 font-semibold">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {rapport.lignes.map((l, i) => (
                <tr key={`${l.jour}-${l.equipe}-${i}`} className="border-t border-white/10">
                  <td className="py-2 pr-4 whitespace-nowrap text-cream/70">{l.jour}</td>
                  <td className="py-2 pr-4 text-cream/70">{l.equipe}</td>
                  <td className="py-2 pr-4 font-bold">{l.score}</td>
                  <td className="py-2 pr-4 text-cream/50" title={l.extrait}>
                    {l.adversaire || "—"}
                  </td>
                  <td className={`py-2 text-xs font-semibold ${ETAT[l.etat].classe}`}>
                    {ETAT[l.etat].texte}
                    {l.notifie ? ` · ${l.notifie} prévenu(s)` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-cream/40">
            « Match absent du calendrier » : ce match existe sur SportCorico mais pas dans
            l&apos;application. Ajoutez-le depuis Matchs pour que son score soit repris.
          </p>
        </div>
      )}
    </div>
  );
}
