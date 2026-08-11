/**
 * Classement de depart des Seniors (saison 2026/2027).
 * Les 12 clubs de la poule, tout a zero avant la premiere journee.
 * Lancer avec :  npm run db:classement
 *
 * Relançable : le classement de la categorie est remis a zero puis recree.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIE = "seniors"; // slug de l'equipe

// Les 11 adversaires du calendrier + l'USAP, par ordre alphabetique
const CLUBS = [
  "B.C.V. FC 2",
  "Bucy Long FC Billy 2",
  "Chemin des Dames US",
  "Coincy FJEP",
  "Crouy Cuffies EF 2",
  "Guignicourt US 2",
  "Milonais Faverolles",
  "Neuilly AS",
  "Retz FC",
  "US Anizy Pinon",
  "Vierzy FC",
  "Villeneuve St Germain",
];

async function main() {
  const team = await prisma.team.findUnique({ where: { slug: CATEGORIE } });
  if (!team) {
    console.error(`Catégorie "${CATEGORIE}" introuvable. Lancez d'abord npm run db:seed.`);
    process.exit(1);
  }

  await prisma.standingRow.deleteMany({ where: { teamId: team.id } });

  for (const [i, nom] of CLUBS.entries()) {
    await prisma.standingRow.create({
      data: {
        teamId: team.id,
        position: i + 1,
        clubName: nom,
        isUsap: nom === "US Anizy Pinon",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    });
  }

  console.log(`Classement créé : ${CLUBS.length} clubs pour ${team.name}.`);
  console.log("Mettez à jour les chiffres depuis Admin > Classement après chaque journée.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
