/**
 * Donnees de depart de l'US Anizy Pinon.
 * Lancer avec :  npm run db:seed
 * Le script est "idempotent" : on peut le relancer sans creer de doublons.
 */
import { PrismaClient, BoardGroup } from "@prisma/client";

const prisma = new PrismaClient();

const TEAMS = [
  { name: "U6 · U7", level: "Football à 5", venue: "Stade d'Anizy" },
  { name: "U8 · U9", level: "Football à 5", venue: "Stade d'Anizy" },
  { name: "U10 · U11", level: "Football à 8", venue: "Stade de Pinon" },
  { name: "U12 · U13", level: "Football à 8", venue: "Stade de Pinon" },
  { name: "U14 · U15", level: "Football à 11", venue: "Stade d'Anizy" },
  { name: "Pôle Féminin Jeune", level: "Football Féminin", venue: "Stade de Pinon" },
  { name: "Féminines Seniors", level: "Football à 11", venue: "Stade de Pinon" },
  { name: "Seniors", level: "Football à 11", venue: "Stade d'Anizy" },
  { name: "Vétérans", level: "Loisir", venue: "Stade de Pinon" },
];

const BOARD: {
  firstName: string;
  lastName: string;
  role: string;
  group: BoardGroup;
}[] = [
  { firstName: "Lydie", lastName: "Broyart", role: "Présidente", group: "BUREAU" },
  {
    firstName: "Boris",
    lastName: "Arnould",
    role: "Vice-Président Formation & Partenariats",
    group: "BUREAU",
  },
  { firstName: "Areskie", lastName: "Bouaziz", role: "Vice-Président", group: "BUREAU" },
  { firstName: "Francis", lastName: "Renaud", role: "Secrétaire", group: "BUREAU" },
  { firstName: "Yoann", lastName: "Choquet", role: "Trésorier", group: "BUREAU" },

  {
    firstName: "Raphaël",
    lastName: "Mahu",
    role: "Communication & Animation",
    group: "RESPONSABLE",
  },
  { firstName: "Quantin", lastName: "Arnould", role: "Responsable Jeunes", group: "RESPONSABLE" },
  {
    firstName: "Claude",
    lastName: "Blondelle",
    role: "Responsable Féminines",
    group: "RESPONSABLE",
  },
  { firstName: "Pascal", lastName: "Guérin", role: "Responsable Arbitrage", group: "RESPONSABLE" },
  {
    firstName: "Stéphane",
    lastName: "Pracz",
    role: "Responsable Contrat Civique",
    group: "RESPONSABLE",
  },
  { firstName: "Arnaud", lastName: "Santus", role: "Responsable Buvette", group: "RESPONSABLE" },
  { firstName: "Léna", lastName: "Bonamour", role: "Buvette Adjointe", group: "RESPONSABLE" },

  { firstName: "Romain", lastName: "Torlet", role: "Membre du comité", group: "COMITE" },
  { firstName: "Arnaud", lastName: "Torlet", role: "Membre du comité", group: "COMITE" },
  { firstName: "David", lastName: "Torlet", role: "Membre du comité", group: "COMITE" },
  { firstName: "Paulo", lastName: "Cardoso", role: "Membre du comité", group: "COMITE" },
];

const STAFF = [
  { firstName: "Noémy", lastName: "Vimeux", role: "Éducatrice", team: "Pôle Féminin Jeune" },
  { firstName: "Alexandra", lastName: "Hellé", role: "Éducatrice", team: "Pôle Féminin Jeune" },
  { firstName: "Christophe", lastName: "Lecoutre", role: "Entraîneur", team: "Seniors" },
];

// Joueurs deja photographies (les photos sont hebergees sur le site du club).
const PHOTO = (f: string) => `https://usanizypinon.fr/photos/${f}`;
const PLAYERS = [
  { firstName: "Sacha", lastName: "Nowak", team: "U8 · U9", photo: "sacha-nowak.jpg" },
  { firstName: "Eyaz", lastName: "", team: "U10 · U11", photo: "eyaz.jpg" },
  { firstName: "Nolan", lastName: "Boulogne", team: "U10 · U11", photo: "nolan-boulogne.jpg" },
  { firstName: "Timéo", lastName: "Lecoultre", team: "U10 · U11", photo: "timeo-lecoultre.jpg" },
  { firstName: "Solane", lastName: "Batteux", team: "U14 · U15", photo: "solane-batteux.jpg" },
  { firstName: "Léna", lastName: "Lecoutre", team: "Féminines Seniors", photo: "lena-lecoutre.jpg" },
  { firstName: "Margaux", lastName: "Gouze", team: "Féminines Seniors", photo: "margaux-gouze.jpg" },
  { firstName: "Maxime", lastName: "Fantoli", team: "Seniors", photo: "maxime-fantoli.jpg" },
  { firstName: "John", lastName: "Vigues", team: "Seniors", photo: "john-vigues.jpg" },
  { firstName: "Kevin", lastName: "Dutrieux", team: "Seniors", photo: "kevin-dutrieux.jpg" },
  { firstName: "Kevin", lastName: "Liebert", team: "Seniors", photo: "kevin-liebert.jpg" },
  { firstName: "Pierre", lastName: "Lecluze", team: "Seniors", photo: "pierre-lecluze.jpg" },
  { firstName: "Clément", lastName: "Mahu", team: "Seniors", photo: "clement-mahu.jpg" },
  { firstName: "Dylan", lastName: "Makhloufi", team: "Seniors", photo: "dylan-makhloufi.jpg" },
  { firstName: "Axel", lastName: "Pichelin", team: "Seniors", photo: "axel-pichelin.jpg" },
  { firstName: "Quantin", lastName: "Arnould", team: "Seniors", photo: "quantin-arnould.jpg" },
  { firstName: "Romain", lastName: "Torlet", team: "Seniors", photo: "romain-torlet.jpg" },
  { firstName: "Thibault", lastName: "Genty", team: "Seniors", photo: "thibault-genty.jpg" },
];

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("→ Création des équipes…");
  const teamsBySlug: Record<string, string> = {};
  for (const [i, t] of TEAMS.entries()) {
    const slug = slugify(t.name);
    const team = await prisma.team.upsert({
      where: { slug },
      update: { name: t.name, level: t.level, venue: t.venue, order: i },
      create: { name: t.name, slug, level: t.level, venue: t.venue, order: i },
    });
    teamsBySlug[t.name] = team.id;
  }

  console.log("→ Bureau et responsables…");
  for (const [i, m] of BOARD.entries()) {
    const existe = await prisma.boardMember.findFirst({
      where: { firstName: m.firstName, lastName: m.lastName, role: m.role },
    });
    if (!existe) {
      await prisma.boardMember.create({ data: { ...m, order: i } });
    }
  }

  console.log("→ Encadrement…");
  for (const s of STAFF) {
    const existe = await prisma.staff.findFirst({
      where: { firstName: s.firstName, lastName: s.lastName },
    });
    if (!existe) {
      await prisma.staff.create({
        data: {
          firstName: s.firstName,
          lastName: s.lastName,
          role: s.role,
          teamId: teamsBySlug[s.team],
        },
      });
    }
  }

  console.log("→ Joueurs…");
  for (const p of PLAYERS) {
    const existe = await prisma.player.findFirst({
      where: { firstName: p.firstName, lastName: p.lastName, teamId: teamsBySlug[p.team] },
    });
    if (!existe) {
      await prisma.player.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          teamId: teamsBySlug[p.team],
          photo: PHOTO(p.photo),
        },
      });
    }
  }

  console.log("→ Actualité de bienvenue…");
  await prisma.news.upsert({
    where: { slug: "bienvenue-sur-l-application" },
    update: {},
    create: {
      title: "L'application du club est en ligne",
      slug: "bienvenue-sur-l-application",
      tag: "Club",
      excerpt:
        "Retrouvez les matchs de toutes les catégories, les effectifs et vos convocations, directement depuis votre téléphone.",
      body: "Connectez-vous avec votre compte Google pour répondre aux convocations. Les dirigeants mettent à jour les matchs et les résultats depuis l'espace de gestion.",
    },
  });

  const counts = {
    equipes: await prisma.team.count(),
    joueurs: await prisma.player.count(),
    bureau: await prisma.boardMember.count(),
  };
  console.log("Terminé :", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
