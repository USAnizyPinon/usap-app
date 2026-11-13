/** Calendrier privé SportCorico : seul le serveur connaît SPORTCORICO_ICS_URL. */
export type CategorieJeunes = "u6-u7" | "u8-u9" | "u10-u11" | "u12-u13" | "pole-feminin-jeune";
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
  // Les U10-U11 feminines doivent etre rattachees au Pole Feminin Jeune,
  // AVANT la detection generique des U10-U11 masculins/mixtes.
  // On exige un indice explicite de feminines dans le meme libelle.
  const estFeminine = /\b(FEMININES?|FILLES|FEMININ|U\s*1[01]\s*F|U\s*1[01]F|U10\s*[-/.· ]\s*U11\s*F|POLE FEMININ)\b/.test(s);
  const estU10U11 = /\bU\s*10\b|\bU\s*11\b/.test(s);
  if (estFeminine && (estU10U11 || /POLE FEMININ/.test(s))) return "pole-feminin-jeune";
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

/** Règle USAP confirmée : les matchs privés génériques de 13 h sont les U12-U13.
 * Heure de Paris (y compris passage été/hiver), jamais UTC.
 * Les rencontres publiques explicitement nommées restent hors de cette règle.
 */
function estMatchPriveU12U13(titre: string, debut: Date): boolean {
  if (!/^Match\s*-\s*Match\b/i.test(titre)) return false;
  const heureParis = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23",
  }).format(debut);
  return heureParis === "13";
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
    // La description peut preciser "feminines" alors que le titre n'indique que U10-U11.
    // Ne pas chercher la categorie dans l'URL du lien SportCorico.
    const fusion = `${titre} ${desc.replace(/https?:\/\/\S+/g, "")}`;
    const feminine = categorie(fusion) === "pole-feminin-jeune" ? "pole-feminin-jeune" : null;
    const cat = feminine ?? categorie(titre) ?? categorie(desc) ?? (estMatchPriveU12U13(titre, debut) ? "u12-u13" : null);
    resultat.push({ uid, debut, titre, lieu: decoder(champs.get("LOCATION") ?? "").trim() || null, categorie: cat, statut });
  }
  // SportCorico publie parfois deux plateaux U10-U11 distincts avec exactement
  // le meme libelle, le meme depart et le meme lieu. Dans l'organisation USAP,
  // le second correspond au Pole Feminin Jeune. Les UID doivent rester distincts.
  // Ne pas appliquer cette regle a trois evenements ou plus : ambiguité.
  const groupes = new Map<string, EvenementICS[]>();
  for (const ev of resultat) {
    if (ev.categorie !== "u10-u11" || !/^Plateau\s*-\s*Plateau\s+U\s*10\s+U?\s*11\b/i.test(ev.titre)) continue;
    const cle = `${ev.debut.toISOString()}|${ev.titre.toLocaleLowerCase("fr-FR")}|${(ev.lieu ?? "").toLocaleLowerCase("fr-FR")}`;
    const groupe = groupes.get(cle) ?? [];
    groupe.push(ev);
    groupes.set(cle, groupe);
  }
  for (const groupe of groupes.values()) {
    if (groupe.length === 2) groupe[1].categorie = "pole-feminin-jeune";
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
