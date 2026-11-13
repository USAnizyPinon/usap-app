/**
 * Relie chaque categorie a sa page publique SportCorico.
 * Lancer avec :  npm run db:sportcorico
 * Relancable sans risque : le script ne fait qu'ecrire l'adresse.
 *
 * Les adresses viennent de la page du club :
 *   https://www.sportcorico.com/clubs/us-anizy-pinon
 * Si une equipe est ajoutee sur SportCorico, ajoutez sa ligne ici, ou
 * collez simplement son adresse depuis l'espace d'administration,
 * onglet « Créneaux ».
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://www.sportcorico.com/clubs/us-anizy-pinon";

const LIENS: { slug: string; url: string; note: string }[] = [
  { slug: "seniors", url: `${BASE}/anizy-pinon-us`, note: "Seniors 1 · Départemental 3, poule C" },
  { slug: "feminines-seniors", url: `${BASE}/anizy-pinon-us-9`, note: "Seniors féminines 1" },
  { slug: "u14-u15", url: `${BASE}/anizy-pinon-us-1`, note: "U15 1 · U15 D2, poule F" },
  // A verifier : SportCorico appelle ce groupe « Loisirs 1 », l'application
  // « Vétérans ». Retirez cette ligne s'il ne s'agit pas de la meme equipe.
  { slug: "veterans", url: `${BASE}/anizy-pinon-us-3`, note: "Loisirs 1 · Crit Loisirs J1, poule C" },
];

async function main() {
  for (const lien of LIENS) {
    const equipe = await prisma.team.findUnique({ where: { slug: lien.slug } });
    if (!equipe) {
      console.log(`– ${lien.slug} : catégorie introuvable, ignorée`);
      continue;
    }
    await prisma.team.update({
      where: { id: equipe.id },
      data: { sportcoricoUrl: lien.url },
    });
    console.log(`✓ ${equipe.name} → ${lien.note}`);
  }

  const total = await prisma.team.count({ where: { sportcoricoUrl: { not: null } } });
  console.log(`\nTerminé : ${total} catégorie(s) reliée(s) à SportCorico.`);
  console.log("Vérifiez la lecture dans Admin → Scores auto → « Tester sans enregistrer ».");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
