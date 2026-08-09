"use client";

import { useEffect, useState } from "react";

/** Convertit la cle VAPID (base64url) au format attendu par le navigateur. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Etat = "chargement" | "impossible" | "inactif" | "actif" | "refuse";

export default function NotificationsCard() {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [installe, setInstalle] = useState(true);

  useEffect(() => {
    // iOS n'autorise les notifications que si l'app est sur l'ecran d'accueil.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error propriete specifique a Safari iOS
      window.navigator.standalone === true;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setInstalle(!ios || standalone);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEtat("impossible");
      return;
    }
    if (Notification.permission === "denied") {
      setEtat("refuse");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "actif" : "inactif"))
      .catch(() => setEtat("impossible"));
  }, []);

  async function activer() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat("refuse");
        return;
      }

      const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!cle) throw new Error("Notifications non configurées sur le serveur.");

      const reg = await navigator.serviceWorker.ready;
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

      setEtat("actif");
      setMessage("Notifications activées sur cet appareil.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Activation impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function desactiver() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEtat("inactif");
      setMessage("Notifications désactivées sur cet appareil.");
    } catch {
      setMessage("Désactivation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      {etat === "chargement" && <p className="text-sm text-cream/55">Vérification…</p>}

      {etat === "impossible" && (
        <p className="text-sm text-cream/70">
          Ce navigateur ne gère pas les notifications. Essayez Chrome sur Android, ou
          installez l&apos;application sur votre écran d&apos;accueil.
        </p>
      )}

      {etat === "refuse" && (
        <p className="text-sm text-cream/70">
          Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages de
          votre navigateur, puis revenez ici.
        </p>
      )}

      {!installe && etat !== "impossible" && (
        <p className="mb-4 rounded-lg border border-jaune/30 bg-jaune/10 px-3 py-2 text-xs text-jaune">
          Sur iPhone, ajoutez d&apos;abord l&apos;application à votre écran d&apos;accueil
          (bouton Partager → « Sur l&apos;écran d&apos;accueil »), puis rouvrez-la pour
          activer les notifications.
        </p>
      )}

      {(etat === "actif" || etat === "inactif") && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold">
              {etat === "actif"
                ? "Notifications activées sur cet appareil"
                : "Notifications désactivées"}
            </p>
            <p className="mt-1 text-xs text-cream/55">
              Vous recevrez les matchs de vos catégories et les actualités du club.
            </p>
          </div>
          {etat === "actif" ? (
            <button onClick={desactiver} disabled={busy} className="btn-ghost !py-2 text-xs">
              {busy ? "…" : "Désactiver"}
            </button>
          ) : (
            <button onClick={activer} disabled={busy} className="btn-jaune !py-2 text-xs">
              {busy ? "…" : "Activer les notifications"}
            </button>
          )}
        </div>
      )}

      {message && <p className="mt-3 text-xs text-cream/60">{message}</p>}
    </div>
  );
}
