/**
 * Lecture d'une extraction Footclubs (menu Competitions > Editions et extractions).
 * Le fichier est un CSV, souvent en point-virgule et encode a la francaise.
 * On detecte tout automatiquement pour eviter toute manipulation.
 */

export type LigneMatch = {
  ligne: number;
  date: Date | null;
  domicile: string;
  exterieur: string;
  competition: string;
  terrain: string;
  /** true si l'USAP recoit */
  aDomicile: boolean;
  adversaire: string;
  erreur?: string;
};

/** Enleve accents, majuscules et espaces en trop. */
function normaliser(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Le club, c'est nous : on repere Anizy ou Pinon dans le nom. */
export function estNotreClub(nom: string) {
  const n = normaliser(nom);
  return n.includes("anizy") || n.includes("pinon") || n.includes("usap");
}

/** Decoupe une ligne CSV en tenant compte des guillemets. */
function decouper(ligne: string, sep: string) {
  const cases: string[] = [];
  let courant = "";
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        dansGuillemets = !dansGuillemets;
      }
    } else if (c === sep && !dansGuillemets) {
      cases.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  cases.push(courant);
  return cases.map((c) => c.trim().replace(/^"|"$/g, ""));
}

/** Point-virgule, tabulation ou virgule : on prend le plus frequent. */
function trouverSeparateur(entete: string) {
  const candidats = [";", "\t", ","];
  let meilleur = ";";
  let max = 0;
  for (const c of candidats) {
    const n = entete.split(c).length;
    if (n > max) {
      max = n;
      meilleur = c;
    }
  }
  return meilleur;
}

/** Retrouve une colonne d'apres plusieurs noms possibles. */
function trouverColonne(entetes: string[], noms: string[]) {
  for (let i = 0; i < entetes.length; i++) {
    const e = normaliser(entetes[i]);
    if (noms.some((n) => e === n || e.includes(n))) return i;
  }
  return -1;
}

/** "12/10/2025" + "15:00" -> Date */
function construireDate(dateTxt: string, heureTxt: string): Date | null {
  const d = dateTxt.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (!d) return null;

  const jour = Number(d[1]);
  const mois = Number(d[2]);
  let annee = Number(d[3]);
  if (annee < 100) annee += 2000;

  let heures = 15;
  let minutes = 0;
  const h = heureTxt?.match(/(\d{1,2})[h:.](\d{2})?/i);
  if (h) {
    heures = Number(h[1]);
    minutes = Number(h[2] ?? 0);
  }

  // Verifications : JavaScript accepte sinon le 32 janvier en le decalant
  if (jour < 1 || jour > 31) return null;
  if (mois < 1 || mois > 12) return null;
  if (heures > 23 || minutes > 59) return null;
  if (annee < 2000 || annee > 2100) return null;

  const date = new Date(annee, mois - 1, jour, heures, minutes);
  if (Number.isNaN(date.getTime())) return null;
  // Le 31 février se transforme en 3 mars : on le refuse
  if (date.getDate() !== jour || date.getMonth() !== mois - 1) return null;

  return date;
}

/** Lit le contenu du fichier et renvoie les rencontres trouvees. */
export function lireExtraction(contenu: string): LigneMatch[] {
  const lignes = contenu
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "" && l.replace(/[;,\t]/g, "").trim() !== "");

  if (lignes.length < 2) return [];

  const sep = trouverSeparateur(lignes[0]);
  const entetes = decouper(lignes[0], sep);

  const iDate = trouverColonne(entetes, ["date"]);
  const iHeure = trouverColonne(entetes, ["heure", "horaire"]);
  const iDom = trouverColonne(entetes, ["domicile", "recevant", "equipe 1", "club recevant"]);
  const iExt = trouverColonne(entetes, ["exterieur", "visiteur", "equipe 2", "club visiteur"]);
  const iComp = trouverColonne(entetes, ["competition", "epreuve", "categorie"]);
  const iTerrain = trouverColonne(entetes, ["terrain", "installation", "stade", "lieu"]);

  // Sans equipes identifiables, on ne peut rien faire
  if (iDom === -1 || iExt === -1) return [];

  const resultats: LigneMatch[] = [];

  for (let i = 1; i < lignes.length; i++) {
    const cases = decouper(lignes[i], sep);
    const domicile = cases[iDom] ?? "";
    const exterieur = cases[iExt] ?? "";
    if (!domicile || !exterieur) continue;

    const date = construireDate(
      iDate >= 0 ? (cases[iDate] ?? "") : "",
      iHeure >= 0 ? (cases[iHeure] ?? "") : ""
    );

    const nousDomicile = estNotreClub(domicile);
    const nousExterieur = estNotreClub(exterieur);

    let erreur: string | undefined;
    if (!date) erreur = "Date illisible";
    else if (!nousDomicile && !nousExterieur) erreur = "L'USAP n'apparaît pas";

    resultats.push({
      ligne: i + 1,
      date,
      domicile,
      exterieur,
      competition: iComp >= 0 ? (cases[iComp] ?? "") : "",
      terrain: iTerrain >= 0 ? (cases[iTerrain] ?? "") : "",
      aDomicile: nousDomicile,
      adversaire: nousDomicile ? exterieur : domicile,
      erreur,
    });
  }

  return resultats;
}

/** Devine le type de competition d'apres son libelle. */
export function deviner(competition: string): "CHAMPIONNAT" | "COUPE" | "AMICAL" | "PLATEAU" {
  const c = normaliser(competition);
  if (c.includes("coupe")) return "COUPE";
  if (c.includes("amical")) return "AMICAL";
  if (c.includes("plateau")) return "PLATEAU";
  return "CHAMPIONNAT";
}
