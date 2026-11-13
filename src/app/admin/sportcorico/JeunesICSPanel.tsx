"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RapportICS } from "@/lib/sportcorico-ics-sync";

export default function JeunesICSPanel() {
  const [rapport, setRapport] = useState<RapportICS | null>(null);
  const [erreur, setErreur] = useState("");
  const [charge, setCharge] = useState(false);
  const router = useRouter();
  async function lancer(test: boolean) {
    setCharge(true); setErreur(""); setRapport(null);
    try {
      const res = await fetch(`/api/admin/sportcorico-ics${test ? "?test=1" : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lecture impossible");
      setRapport(json);
      if (!test && (json.crees + json.modifies > 0)) router.refresh();
    } catch (e) { setErreur(e instanceof Error ? e.message : "Erreur inconnue"); }
    finally { setCharge(false); }
  }
  return <section className="mt-10 space-y-4">
    <div className="card space-y-3">
      <h3 className="font-display text-lg font-black uppercase">Calendrier privé SportCorico · jeunes</h3>
      <p className="text-sm text-cream/70">Les U6-U7, U8-U9 et U10-U11 sont reconnus dans les événements. Pour les U12-U13, les matchs privés intitulés « Match - Match… » à 13 h (heure de Paris) sont aussi reconnus. Les événements non identifiés ne sont pas publiés. Le lien ICS reste secret sur Vercel.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-ghost !py-2 disabled:opacity-40" disabled={charge} onClick={() => lancer(true)}>{charge ? "Lecture…" : "Tester les jeunes sans enregistrer"}</button>
        <button type="button" className="btn-jaune !py-2 disabled:opacity-40" disabled={charge} onClick={() => lancer(false)}>Importer les jeunes</button>
      </div>
    </div>
    {erreur && <p className="card text-red-300">{erreur}</p>}
    {rapport && <div className="card space-y-4 text-sm">
      {!rapport.actif ? <p className="text-jaune">Le flux ICS n'est pas encore activé. Ajouter SPORTCORICO_ICS_URL dans les variables Vercel.</p> : <>
        <p className="font-bold">{rapport.lus} matchs/plateaux lus · {rapport.classes} classés · {rapport.sansCategorie} sans catégorie · {rapport.u12u13} U12-U13</p>
        <p>{rapport.crees} à ajouter · {rapport.modifies} à modifier · {rapport.conflits} doublon(s)/conflit(s) ignoré(s)</p>
        <p className="text-cream/60">Les événements sans catégorie restent exclus. Les matchs privés génériques à 13 h sont attribués aux U12-U13 selon la règle du club.</p>
        {rapport.lignes.length > 0 && <div className="max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th>Date</th><th>Équipe</th><th>Événement</th><th>État</th></tr></thead><tbody>{rapport.lignes.map((l,i)=><tr key={i} className="border-t border-white/10"><td className="py-2 pr-2">{l.date}</td><td className="pr-2">{l.categorie}</td><td className="pr-2">{l.titre}</td><td>{l.statut}</td></tr>)}</tbody></table></div>}
        {rapport.exemplesSansCategorie.length > 0 && <div className="space-y-2"><h4 className="font-bold">À identifier (dont potentiellement les U12-U13 privés)</h4><div className="max-h-56 overflow-auto">{rapport.exemplesSansCategorie.map((l,i)=><p key={i} className="border-t border-white/10 py-1 text-xs text-cream/60">{l.date} · {l.titre}</p>)}</div></div>}
      </>}
    </div>}
  </section>;
}
