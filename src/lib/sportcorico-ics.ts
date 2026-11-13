/** Calendrier privé SportCorico : seul le serveur connaît SPORTCORICO_ICS_URL. */
export type CategorieJeunes = "u6-u7" | "u8-u9" | "u10-u11" | "u12-u13";
export type EvenementICS = {
  uid: string;
  debut: Date;
  titre: string;
  lieu: string | null;
  categorie: CategorieJeunes | null;
  statut: string;
};

function decoder(s: string): string {
  return s.replace(/\\[nN]/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function dateUTC(s: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  return Number.isNaN(d.valueOf()) ? null : d;
}

/** Ne classe jamais les matchs selon l'âge uniquement ou une supposition sur le terrain. */
function categorie(texte: string): CategorieJeunes | null {
  const s = texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const paires: [RegExp, CategorieJeunes][] = [
    [/\bU\s*6\s*(?:[-/.·]|ET|A|\s)\s*U?\s*7\b|\bU6\s*U7\b/, "u6-u7"],
    [/\bU\s*8\s*(?:[-/.·]|ET|A|\s)\s*U?\s*9\b|\bU8\s*U9\b/, "u8-u9"],
    [/\bU\s*10\s*(?:[-/.·]|ET|A|\s)\s*U?\s*11\b|\bU10\s*U11\b/, "u10-u11"],
    [/\bU\s*12\s*(?:[-/.·]|ET|A|\s)\s*U?\s*13\b|\bU12\s*U13\b/, "u12-u13"],
  ];
  const trouves = paires.filter(([re]) => re.test(s));
  if (trouves.length === 1) return trouves[0][1];
  // Match isolé U12 ou U13 : seulement si c'est un indice explicite et unique.
  const simples: [RegExp, CategorieJeunes][] = [
    [/\bU\s*(?:6|7)\b/, "u6-u7"], [/\bU\s*(?:8|9)\b/, "u8-u9"],
    [/\bU\s*(?:10|11)\b/, "u10-u11"], [/\bU\s*(?:12|13)\b/, "u12-u13"],
  ];
  const uniques = Array.from(new Set(simples.filter(([re]) => re.test(s)).map(([, c]) => c)));
  return uniques.length === 1 ? uniques[0] : null;
}

export function analyserCalendrierICS(texteBrut: string): EvenementICS[] {
  if (!texteBrut.includes("BEGIN:VCALENDAR")) throw new Error("Flux ICS invalide.");
  const deplies = texteBrut.replace(/\r?\n[ \t]/g, "");
  const resultat: EvenementICS[] = [];
  const vus = new Set<string>();
  for (const bloc of deplies.split("BEGIN:VEVENT").slice(1)) {
    const champs = new Map<string, string>();
    for (const ligne of bloc.split("END:VEVENT")[0].split(/\r?\n/)) {
      const pos = ligne.indexOf(":");
      if (pos < 0) continue;
      champs.set(ligne.slice(0, pos).split(";")[0].toUpperCase(), ligne.slice(pos + 1));
    }
    const uid = champs.get("UID")?.trim();
    const debut = dateUTC(champs.get("DTSTART") ?? "");
    const titre = decoder(champs.get("SUMMARY") ?? "").trim();
    const statut = (champs.get("STATUS") ?? "").trim().toUpperCase();
    if (!uid || !debut || vus.has(uid) || !/^(Match|Plateau)\s*-/i.test(titre)) continue;
    vus.add(uid);
    if (statut === "CANCELLED") continue; // Ne jamais publier un événement annulé.
    const desc = decoder(champs.get("DESCRIPTION") ?? "");
    // Titre prioritaire. Description utilisée seulement si une catégorie y apparaît sans ambiguïté.
    const cat = categorie(titre) ?? categorie(desc);
    resultat.push({ uid, debut, titre, lieu: decoder(champs.get("LOCATION") ?? "").trim() || null, categorie: cat, statut });
  }
  return resultat;
}

export async function chargerCalendrierICS(): Promise<EvenementICS[] | null> {
  const secret = process.env.SPORTCORICO_ICS_URL?.trim();
  if (!secret) return null;
  let url: URL;
  try { url = new URL(secret); } catch { throw new Error("SPORTCORICO_ICS_URL n'est pas une URL valide."); }
  if (url.protocol !== "https:" || url.hostname !== "api.sportcorico.com" || !/^\/api\/calendar\/[A-Za-z0-9_-]+\.ics$/.test(url.pathname)) {
    throw new Error("SPORTCORICO_ICS_URL doit être un lien HTTPS SportCorico .ics.");
  }
  const reponse = await fetch(url.toString(), { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!reponse.ok) throw new Error(`Le calendrier SportCorico a répondu HTTP ${reponse.status}.`);
  return analyserCalendrierICS(await reponse.text());
}
