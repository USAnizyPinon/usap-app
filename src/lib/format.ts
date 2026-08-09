import type { Competition, Match } from "@prisma/client";

export const COMPETITION_LABEL: Record<Competition, string> = {
  CHAMPIONNAT: "Championnat",
  COUPE: "Coupe",
  AMICAL: "Amical",
  PLATEAU: "Plateau",
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function formatDate(d: Date) {
  return dateFmt.format(d);
}
export function formatTime(d: Date) {
  return timeFmt.format(d);
}
export function formatDateTime(d: Date) {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

/** Valeur pour un <input type="datetime-local"> */
export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
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
