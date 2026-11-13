import type { Competition, Match } from "@prisma/client";

export const COMPETITION_LABEL: Record<Competition, string> = {
  CHAMPIONNAT: "Championnat",
  COUPE: "Coupe",
  AMICAL: "Amical",
  PLATEAU: "Plateau",
};

// Vercel fonctionne en UTC. Toutes les dates publiques du club sont affichees
// dans le fuseau français, y compris lors des changements d'heure.
const ZONE = "Europe/Paris";
const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date) {
  return dateFmt.format(d);
}
export function formatTime(d: Date) {
  return timeFmt.format(d);
}
export function formatDateTime(d: Date) {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

/** Valeur pour un <input type="datetime-local">, toujours en heure française. */
export function toLocalInput(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export type MatchResult = "VICTOIRE" | "NUL" | "DEFAITE" | null;

/** Le score est saisi du point de vue de l'USAP. */
export function resultOf(m: Pick<Match, "scoreFor" | "scoreAgainst">): MatchResult {
  if (m.scoreFor == null || m.scoreAgainst == null) return null;
  if (m.scoreFor > m.scoreAgainst) return "VICTOIRE";
  if (m.scoreFor < m.scoreAgainst) return "DEFAITE";
  return "NUL";
}

export function resultClasses(r: MatchResult) {
  if (r === "VICTOIRE") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (r === "DEFAITE") return "bg-red-500/15 text-red-300 border-red-400/30";
  if (r === "NUL") return "bg-white/10 text-cream/75 border-white/20";
  return "";
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Styles de competitions inchanges. */
export const COMPETITION_STYLE: Record<Competition, { badge: string; accent: string; texte: string }> = {
  CHAMPIONNAT: {
    badge: "border-jaune/40 bg-jaune/10 text-jaune",
    accent: "bg-jaune",
    texte: "text-jaune",
  },
  COUPE: {
    badge: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    accent: "bg-sky-400",
    texte: "text-sky-300",
  },
  AMICAL: {
    badge: "border-cream/30 bg-white/10 text-cream/80",
    accent: "bg-cream/60",
    texte: "text-cream/80",
  },
  PLATEAU: {
    badge: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    accent: "bg-violet-400",
    texte: "text-violet-300",
  },
};
