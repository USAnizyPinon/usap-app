"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CACHE_KEY = "usap-notifs-proposees";

/** Convertit la clé VAPID au format attendu par le navigateur. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Proposé une seule fois, après la première connexion.
 * Le navigateur exige un geste : impossible d'activer sans clic.
 * Toutes les catégories sont déjà cochées côté serveur, la personne
 * peut tout ajuster ensuite depuis Mon espace.
 */
export default function NotifPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return; // déjà répondu

    try {
      if (window.localStorage.getItem(CACHE_KEY)) return;
    } catch {
      // navigation privée : on propose quand même
    }

    // Sur iPhone, les notifications n'existent que si l'app est installée
    const estIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error propriété spécifique à Safari iOS
      window.navigator.standalone === true;
    if (estIos && !installee) return;
    setIos(estIos);

    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function nePlusProposer() {
    try {
      window.localStorage.setItem(CACHE_KEY, "1");
    } catch {
      // sans stockage, la proposition réapparaîtra : pas bloquant
    }
    setVisible(false);
  }

  async function activer() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        nePlusProposer();
        return;
      }

      const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!cle) throw new Error("Notifications non configurées.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cle),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Enregistrement impossible.");

      setMessage("C'est activé ! Vous serez prévenu des matchs et actualités.");
      setTimeout(nePlusProposer, 2500);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Activation impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-jaune/40 bg-noir-2 p-4 shadow-card">
      <p className="font-display text-lg font-black uppercase text-jaune">
        Restez informé
      </p>
      <p className="mt-2 text-sm leading-relaxed text-cream/75">
        Recevez les matchs, les résultats et les actualités du club directement sur votre
        téléphone. Vous choisissez ensuite vos catégories dans{" "}
        <Link href="/mon-espace" className="underline hover:text-jaune">
          Mon espace
        </Link>
        {ios ? " (et vous pouvez tout désactiver quand vous voulez)." : "."}
      </p>

      {message ? (
        <p className="mt-3 text-xs font-semibold text-emerald-300">{message}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={activer} disabled={busy} className="btn-jaune !py-2 text-xs">
            {busy ? "Activation…" : "Activer les notifications"}
          </button>
          <button onClick={nePlusProposer} className="btn-ghost !py-2 text-xs">
            Plus tard
          </button>
        </div>
      )}
    </div>
  );
}
