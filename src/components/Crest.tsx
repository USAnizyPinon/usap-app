/**
 * Ecusson d'equipe en forme de bouclier, repris du blason du club.
 * - USAP : le vrai ecusson
 * - Adversaire : son logo s'il est renseigne, sinon ses initiales
 */
export default function Crest({
  name,
  logo,
  usap = false,
  size = "md",
}: {
  name: string;
  logo?: string | null;
  usap?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-20 w-20" }[size];
  const text = { sm: "text-[11px]", md: "text-sm", lg: "text-lg" }[size];

  const initiales = name
    .replace(/^(FC|US|AS|ES|CS|SC|RC|AC)\s+/i, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join("")
    .toUpperCase();

  if (usap || logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={usap ? "/logo.png" : (logo as string)}
        alt=""
        loading="lazy"
        className={`${dims} shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,.5)]`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${dims} ${text} grid shrink-0 place-items-center border border-white/15 bg-noir-3 font-display font-black text-cream/70`}
      style={{ clipPath: "polygon(50% 0,100% 12%,100% 66%,50% 100%,0 66%,0 12%)" }}
    >
      {initiales || "?"}
    </span>
  );
}
