import { prisma } from "./prisma";
import { chargerCalendrierICS } from "./sportcorico-ics";
import { jourParis } from "./sportcorico-sync";

export type RapportICS = {
  actif: boolean;
  lus: number;
  classes: number;
  sansCategorie: number;
  u12u13: number;
  poleFeminin: number;
  crees: number;
  modifies: number;
  conflits: number;
  exemplesSansCategorie: { date: string; titre: string }[];
  lignes: { categorie: string; titre: string; date: string; statut: string }[];
};

export async function synchroniserJeunesICS(test = false): Promise<RapportICS> {
  const flux = await chargerCalendrierICS();
  const rapport: RapportICS = { actif: flux !== null, lus: flux?.length ?? 0, classes: 0, sansCategorie: 0, u12u13: 0, poleFeminin: 0, crees: 0, modifies: 0, conflits: 0, exemplesSansCategorie: [], lignes: [] };
  if (!flux) return rapport;
  const equipes = await prisma.team.findMany({ where: { slug: { in: ["u6-u7", "u8-u9", "u10-u11", "u12-u13", "pole-feminin-jeune"] } } });
  const parSlug = new Map(equipes.map((e) => [e.slug, e]));
  for (const item of flux) {
    if (!item.categorie) {
      rapport.sansCategorie++;
      // Diagnostic réservé au dirigeant, jamais exposé publiquement.
      if (rapport.exemplesSansCategorie.length < 40) rapport.exemplesSansCategorie.push({ date: jourParis(item.debut), titre: item.titre });
      continue;
    }
    rapport.classes++;
    if (item.categorie === "u12-u13") rapport.u12u13++;
    if (item.categorie === "pole-feminin-jeune") rapport.poleFeminin++;
    const equipe = parSlug.get(item.categorie);
    if (!equipe) continue;
    const cle = `ics:${item.uid}`;
    // Un seul champ d'identifiant déjà présent dans le schéma Prisma : pas de migration.
    const existant = await prisma.match.findUnique({ where: { sportcoricoId: cle } });
    const nom = item.titre.replace(/^(Plateau|Match)\s*-\s*/i, "").trim();
    const plateau = /^Plateau\s*-/i.test(item.titre);
    // Regles metier USAP : U10-U11, U12-U13 et pole feminin jeune
    // jouent en championnat, y compris si le libelle dit "Plateau".
    // U6-U7 et U8-U9 restent des plateaux lorsque SportCorico les designe ainsi.
    const competition = (["u10-u11", "u12-u13", "pole-feminin-jeune"] as string[]).includes(item.categorie)
      ? "CHAMPIONNAT" as const
      : plateau ? "PLATEAU" as const : "AMICAL" as const;
    // Ne pas déduire le domicile d'un simple nom d'adversaire.
    const domicile = !!item.lieu && /\b(PINON|ANIZY)\b/i.test(item.lieu);
    const date = jourParis(item.debut);
    if (existant && existant.teamId !== equipe.id) {
      // Corrige une ancienne synchronisation qui avait attribue le deuxieme
      // plateau U10-U11 au groupe mixte, alors qu'il est feminin.
      // Une attribution manuelle protegee ou un score deja saisi ne bouge pas.
      if (item.categorie === "pole-feminin-jeune" && !existant.scoreLocked &&
          existant.scoreFor === null && existant.scoreAgainst === null) {
        rapport.modifies++;
        rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "À reclasser depuis U10-U11" });
        if (!test) await prisma.match.update({ where: { id: existant.id }, data: {
          teamId: equipe.id, kickoff: item.debut, opponent: nom,
          venue: item.lieu, competition, home: domicile, syncedAt: new Date(),
        } });
      } else {
        rapport.conflits++;
        rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "Conflit de catégorie : vérification nécessaire" });
      }
      continue;
    }
    if (!existant) {
      // Evite de doubler un événement issu de Footclubs ou d'une autre ligne ICS,
      // sans confondre deux plateaux au même horaire mais à des lieux différents.
      const similaires = await prisma.match.findMany({
        where: { teamId: equipe.id, kickoff: { gte: new Date(item.debut.getTime() - 60000), lte: new Date(item.debut.getTime() + 60000) } },
      });
      const doublon = similaires.some(m =>
        m.opponent.trim().toLocaleLowerCase("fr-FR") === nom.toLocaleLowerCase("fr-FR") &&
        (m.venue ?? "").trim().toLocaleLowerCase("fr-FR") === (item.lieu ?? "").trim().toLocaleLowerCase("fr-FR")
      );
      if (doublon) {
        rapport.conflits++;
        rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "Déjà présent (vérifier en admin)" });
        continue;
      }
      rapport.crees++;
      rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "À ajouter" });
      if (!test) await prisma.match.create({ data: {
        teamId: equipe.id, sportcoricoId: cle, kickoff: item.debut, opponent: nom,
        competition, venue: item.lieu, home: domicile, scoreFor: null, scoreAgainst: null,
        syncedAt: new Date(),
      } });
      continue;
    }
    if (existant.scoreLocked) {
      rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "Verrouillé : conservé" });
      continue;
    }
    const changement = existant.kickoff.getTime() !== item.debut.getTime() || existant.opponent !== nom || existant.venue !== item.lieu || existant.competition !== competition || existant.home !== domicile;
    if (changement) {
      rapport.modifies++;
      rapport.lignes.push({ categorie: equipe.name, titre: nom, date, statut: "À mettre à jour" });
      if (!test) await prisma.match.update({ where: { id: existant.id }, data: {
        kickoff: item.debut, opponent: nom, venue: item.lieu, competition, home: domicile, syncedAt: new Date(),
      } });
    }
  }
  return rapport;
}
