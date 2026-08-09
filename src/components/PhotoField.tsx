"use client";

import { useRef, useState } from "react";

type Props = {
  /** Nom du champ envoye dans le formulaire (contiendra l'URL finale). */
  name: string;
  /** Valeur de depart (photo deja enregistree). */
  defaultValue?: string | null;
  /** Sert a nommer le fichier : nom du joueur, titre de l'actu... */
  prefix?: string;
  /** portrait = 3/4 (joueurs, dirigeants) · paysage = 16/9 (actualites) */
  ratio?: "portrait" | "paysage";
  label?: string;
};

const SIZES = {
  portrait: { w: 600, h: 800 },
  paysage: { w: 1280, h: 720 },
};

/**
 * Choisit une image dans la galerie (ou l'appareil photo sur mobile),
 * la recadre automatiquement au bon format, la compresse, puis l'envoie.
 * Le recadrage se fait dans le navigateur : rien de lourd ne transite.
 */
export default function PhotoField({
  name,
  defaultValue,
  prefix = "photo",
  ratio = "portrait",
  label = "Photo",
}: Props) {
  const [url, setUrl] = useState<string>(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  /** Recadre au centre, redimensionne, exporte en JPEG. */
  async function recadrer(file: File): Promise<Blob> {
    const { w, h } = SIZES[ratio];
    const bitmap = await createImageBitmap(file);

    const cible = w / h;
    const source = bitmap.width / bitmap.height;

    // On garde la plus grande zone possible au bon format, centree.
    let sx = 0,
      sy = 0,
      sw = bitmap.width,
      sh = bitmap.height;

    if (source > cible) {
      sw = bitmap.height * cible;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / cible;
      // Sur un portrait, le visage est plutot en haut : on décale moins que le centre.
      sy = ratio === "portrait" ? (bitmap.height - sh) * 0.25 : (bitmap.height - sh) / 2;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Recadrage impossible sur cet appareil.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);

    const blob: Blob | null = await new Promise((r) =>
      canvas.toBlob(r, "image/jpeg", 0.85)
    );
    if (!blob) throw new Error("Recadrage impossible sur cet appareil.");
    return blob;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const blob = await recadrer(file);

      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      fd.append("prefix", prefix);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Envoi impossible.");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-4">
        <div
          className={`overflow-hidden rounded-xl border border-white/15 bg-noir-3 ${
            ratio === "portrait" ? "h-24 w-[72px]" : "h-[54px] w-24"
          }`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-cream/25">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5Z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="btn-ghost !py-2 text-xs"
          >
            {busy ? "Envoi…" : url ? "Changer la photo" : "Choisir une photo"}
          </button>

          {url && !busy && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-xs font-bold text-red-300 hover:text-red-200"
            >
              Retirer
            </button>
          )}
        </div>
      </div>

      {/* accept=image/* ouvre la galerie ET propose l'appareil photo sur mobile */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
        aria-label={label}
      />

      <p className="mt-2 text-[11px] text-cream/40">
        Recadrage automatique en {ratio === "portrait" ? "portrait" : "paysage"}. Prenez la
        photo dans votre galerie ou avec l&apos;appareil photo.
      </p>

      {error && <p className="mt-2 text-xs font-semibold text-red-300">{error}</p>}
    </div>
  );
}
