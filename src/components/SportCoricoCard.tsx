import { SPORTCORICO_ANDROID, SPORTCORICO_IOS, SPORTCORICO_URL } from "@/lib/links";

/**
 * Encart de redirection vers SportCorico.
 * variant "large" : bloc complet (page Mon espace)
 * variant "inline" : bandeau discret (accueil, page matchs)
 */
export default function SportCoricoCard({
  variant = "large",
}: {
  variant?: "large" | "inline";
}) {
  if (variant === "inline") {
    return (
      <a
        href={SPORTCORICO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-center justify-between gap-4 transition hover:border-jaune/50"
      >
        <div>
          <p className="font-bold">Convocations et score en direct</p>
          <p className="mt-1 text-xs text-cream/55">
            Le club utilise SportCorico pour convoquer les joueurs et suivre les matchs
            minute par minute.
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-jaune">Ouvrir →</span>
      </a>
    );
  }

  return (
    <div className="card">
      <p className="eyebrow">Convocations &amp; direct</p>
      <h2 className="mt-3 font-display text-2xl font-black uppercase">
        Ça se passe sur SportCorico
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-cream/70">
        Les convocations aux matchs et aux entraînements, les réponses de présence, les
        compositions et le score en direct sont gérés dans SportCorico. Répondez à vos
        convocations et suivez les rencontres depuis l&apos;application.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={SPORTCORICO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-jaune"
        >
          Ouvrir SportCorico
        </a>
        <a
          href={SPORTCORICO_IOS}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          iPhone
        </a>
        <a
          href={SPORTCORICO_ANDROID}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          Android
        </a>
      </div>
    </div>
  );
}
