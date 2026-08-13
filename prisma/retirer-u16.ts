/**
 * Retire la catégorie U16-U17-U18 de l'application.
 * Lancer avec :  npm run db:retirer-u16
 *
 * Sécurité : refuse de supprimer s'il reste des joueurs, des matchs
 * ou un classement rattachés — pour ne rien perdre par accident.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "u16-u18";

async function main() {
  const team = await prisma.team.findUnique({
    where: { slug: SLUG },
    include: {
      _count: { select: { players: true, matches: true, standing: true, staff: true } },
    },
  });

  if (!team) {
    console.log("Catégorie déjà absente : rien à faire.");
    return;
  }

  const { players, matches, standing } = team._count;
  if (players > 0 || matches > 0 || standing > 0) {
    console.log(
      `Attention : ${team.name} contient encore ${players} joueur(s), ` +
        `${matches} match(s) et ${standing} ligne(s) de classement.`
    );
    console.log("Videz-la d'abord depuis l'espace admin, puis relancez.");
    return;
  }

  // L'encadrement rattaché est simplement détaché
  await prisma.staff.updateMany({ where: { teamId: team.id }, data: { teamId: null } });
  await prisma.team.delete({ where: { id: team.id } });

  console.log(`${team.name} retirée de l'application.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
