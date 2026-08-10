"use client";

import { useEffect, useState } from "react";

/** Evenement propose par Chrome pour declencher l'installation. */
type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CACHE_KEY = "usap-install-cache";

/**
 * Invite à ajouter l'application à l'écran d'accueil.
 * Sur Android, on déclenche l'installation ; sur iPhone, Apple ne le permet pas,
 * on explique donc la manipulation. La bannière ne revient pas si on la ferme.
 */
export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);

  useEffect(() => {
    // Déjà installée : rien à proposer
    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error propriété spécifique à Safari iOS
      window.navigator.standalone === true;
    if (installee) return;

    // Fermée récemment : on n'insiste pas pendant 30 jours
    try {
      const jusqua = Number(window.localStorage.getItem(CACHE_KEY) ?? 0);
      if (jusqua > Date.now()) return;
    } catch {
      // navigation privée : on continue simplement
    }

    const estIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIos(estIos);

    if (estIos) {
      // Safari n'annonce rien : on affiche après un court délai
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function fermer() {
    setVisible(false);
    try {
      const trenteJours = Date.now() + 30 * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(CACHE_KEY, String(trenteJours));
    } catch {
      // sans stockage, la bannière réapparaîtra : ce n'est pas bloquant
    }
  }

  async function installer() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    fermer();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-jaune/30 bg-noir-2 p-4 shadow-card">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-11 w-auto shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Installer l&apos;application</p>
          <p className="mt-1 text-xs leading-relaxed text-cream/65">
            {ios ? (
              <>
                Appuyez sur <b>Partager</b> en bas de Safari, puis sur{" "}
                <b>Sur l&apos;écran d&apos;accueil</b>. Nécessaire pour recevoir les
                notifications du club.
              </>
            ) : (
              <>
                Accédez au club en un geste depuis votre écran d&apos;accueil, et recevez
                les matchs et actualités.
              </>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {!ios && (
              <button onClick={installer} className="btn-jaune !py-2 text-xs">
                Installer
              </button>
            )}
            <button onClick={fermer} className="btn-ghost !py-2 text-xs">
              {ios ? "J'ai compris" : "Plus tard"}
            </button>
          </div>
        </div>

        <button
          onClick={fermer}
          aria-label="Fermer"
          className="shrink-0 text-cream/40 hover:text-cream"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
