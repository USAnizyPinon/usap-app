"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** L'actualisation est lancée par un cron authentifié, jamais par les visiteurs.
 * Un onglet ouvert rafraîchit simplement sa vue périodiquement.
 */
export default function SyncScores() {
  const router = useRouter();
  useEffect(() => {
    const intervalle = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 120_000);
    return () => clearInterval(intervalle);
  }, [router]);
  return null;
}
