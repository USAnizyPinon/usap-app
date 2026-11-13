"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Demande une relecture des scores SportCorico a l'ouverture de la page.
 *
 * Le forfait gratuit de Vercel ne permet qu'un passage planifie par jour.
 * Cette relecture-ci comble le reste du temps : la premiere personne qui
 * ouvre l'application apres un match declenche la mise a jour, et les
 * suivantes voient deja le score.
 *
 * Le serveur limite la frequence a un passage par quart d'heure : ce
 * composant peut donc etre monte sur plusieurs pages sans precaution.
 * N'affiche rien et ne ralentit pas l'affichage.
 */
export default function SyncScores() {
  const router = useRouter();

  useEffect(() => {
    let vivant = true;

    // Laisse la page s'afficher d'abord.
    const differe = setTimeout(() => {
      fetch("/api/cron/sportcorico?auto=1", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((rapport) => {
          // On ne rafraichit que si un score a reellement change.
          if (vivant && rapport && rapport.ecrits > 0) router.refresh();
        })
        .catch(() => {
          // Hors ligne ou service indisponible : la page reste valable.
        });
    }, 1200);

    return () => {
      vivant = false;
      clearTimeout(differe);
    };
  }, [router]);

  return null;
}
