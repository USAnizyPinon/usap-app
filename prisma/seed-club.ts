/**
 * Effectifs, bureau et encadrement de l'US Anizy Pinon.
 * Lancer avec :  npm run db:club
 *
 * Relançable : remplace le bureau, l'encadrement et les joueurs saisis ici,
 * SANS toucher aux fiches déjà reliées à un compte (photo, rattachement).
 *
 * Droit à l'image : les catégories de jeunes sont créées en « prénom + initiale ».
 */
import { PrismaClient, BoardGroup, NameDisplay } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------- BUREAU ---------------- */
const BUREAU: { p: string; n: string; role: string; g: BoardGroup }[] = [
  { p: "Lydie", n: "Broyart", role: "Présidente", g: "BUREAU" },
  { p: "Boris", n: "Arnould", role: "Vice-président · Sponsors & Formation", g: "BUREAU" },
  { p: "Francis", n: "Renaud", role: "Secrétaire", g: "BUREAU" },
  { p: "Yoann", n: "Choquet", role: "Trésorier", g: "BUREAU" },

  { p: "Raphaël", n: "Mahu", role: "Communication & Animation", g: "RESPONSABLE" },
  { p: "Quantin", n: "Arnould", role: "Responsable Jeunes", g: "RESPONSABLE" },
  { p: "Claude", n: "Blondelle", role: "Responsable Féminines", g: "RESPONSABLE" },
  { p: "Pascal", n: "Guerin", role: "Responsable Arbitrage", g: "RESPONSABLE" },
  { p: "Arnaud", n: "Santus", role: "Responsable Buvette", g: "RESPONSABLE" },
  { p: "Léna", n: "Bonamour", role: "Responsable Buvette", g: "RESPONSABLE" },

  { p: "Romain", n: "Torlet", role: "Membre du comité", g: "COMITE" },
  { p: "Arnaud", n: "Torlet", role: "Membre du comité", g: "COMITE" },
  { p: "David", n: "Torlet", role: "Membre du comité", g: "COMITE" },
  { p: "Paulo", n: "Cardoso", role: "Membre du comité", g: "COMITE" },
];

/* ---------------- ENCADREMENT ---------------- */
const STAFF: { p: string; n: string; role: string; team: string | null }[] = [
  { p: "Alexandra", n: "Helle", role: "Éducatrice", team: "u6-u7" },
  { p: "Arnaud", n: "Kowal", role: "Éducateur", team: "u6-u7" },
  { p: "Clément", n: "Mahu", role: "Éducateur", team: "u8-u9" },
  { p: "Raphaël", n: "Mahu", role: "Éducateur", team: "u10-u11" },
  { p: "Paul", n: "Lecluze", role: "Éducateur", team: "u12-u13" },
  { p: "Pierre", n: "Lecluze", role: "Éducateur", team: "u12-u13" },
  { p: "Quantin", n: "Arnould", role: "Éducateur", team: "u14-u15" },
  { p: "Noemy", n: "Vimeux", role: "Éducatrice", team: "pole-feminin-jeune" },
  { p: "Christophe", n: "Lecoutre", role: "Entraîneur", team: "seniors" },
  { p: "Yoann", n: "Choquet", role: "Entraîneur", team: "seniors" },
  { p: "Julien", n: "Flamant", role: "Entraîneur", team: "seniors" },
  { p: "Christophe", n: "Lecoutre", role: "Entraîneur", team: "feminines-seniors" },
  { p: "Corentin", n: "Lebegue", role: "Entraîneur", team: "feminines-seniors" },
  { p: "Eddy", n: "Dupont", role: "Éducateur", team: "veterans" },
];

/* ---------------- JOUEURS ---------------- */
const JOUEURS: Record<string, string[]> = {
  "u6-u7": [
    "Elyo Lapeyrie", "Gabriel Vigues", "Isaac Haine", "Priam Sinoquet", "Sacha Kowal",
  ],
  "u8-u9": [
    "Lucas Bangoura", "Antoine Strazzacappa", "Lissandro Marchandot Mouton",
    "Hugo Hourdin", "Jules Lesaffre", "Nicolas Flamant", "Rayan Machhour",
  ],
  "u10-u11": [
    "Eyaz Mohammad", "Nolan Rollet", "Jules Lavigne", "Luca Accadbled", "Noah Huet",
    "Timeo Lecoutre", "Gabin Torlet", "James Premont", "Léandre Eliet",
    "Lorenzo Waget", "Nino Da Silva", "Noah Loys", "Thiméo Vie",
  ],
  "u12-u13": [
    "Nolan Boulogne", "Raphael Goujon", "Tom Lebegue", "Timeo Liebert", "Jules Nunes",
    "Lucas Vigues", "Mahe Touboulic", "Lucas Le Crosey", "Jules Strazzacappa",
  ],
  "u14-u15": [
    "Alexandre Thibaut", "Noah Teirlynck", "Nolan Allais", "Timeo Balon Lajoie",
    "Auguste Zangrandi", "Thymeo Moinat", "Messon Poulin",
    "Kylian Gadiffet Saint Leger", "Nathael Lechallier", "Enes Akkus",
    "Matheo Collet", "Ethan Chenal", "Solane Batteux", "Aaron Hardiviller",
    "Soan Burlet",
  ],
  "pole-feminin-jeune": [
    "Alice Vigues", "Enora Senechal", "Jade Eliet", "Lexie Lebel", "Lyna Lecomte",
    "Savannagh Hardiviller", "Zoé Mochal",
  ],
  "feminines-seniors": [
    "Alycia Puchois", "Alexandra Helle", "Ameline Magnien", "Anaelle Mereaux",
    "Aurore Lecoutre", "Camille Clément", "Camille Dumas", "Diana Mereaux",
    "Claude Blondelle", "Gwendoline Blondelle", "Léna Lecoutre", "Margaux Gouze",
    "Karly Melro", "Noemy Vimeux",
  ],
  seniors: [
    "Benjamin Clément", "Clément Mahu", "Corentin Lebegue", "John Vigues",
    "Kevin Liebert", "Nolan Bertrand", "Paul Lecluze", "Pierre Lecluze",
    "Quantin Arnould", "Raphaël Mahu", "Romain Torlet", "Thibault Genty",
    "Tony Miel-Fleury", "Tristan Fery", "Yoann Choquet", "Alexis Miel",
    "Iften Bedja", "Lenny Catry", "Malick Kouyate", "Angel Voilet",
    "Trystan Pracz", "Maxence Carlier", "Yoan Barquin", "Thomas Grelon",
    "Imad Al-barghashi", "Matis Sauviat", "Esteban Pineda", "Dany Gomes",
    "Fabio Gorilliot", "Théo Arnould", "Looka Deflandre", "Théo Beaurain",
    "Valentin Genty",
  ],
  veterans: [
    "Yoann Choquet", "Christophe Herbin", "Sebastien Saint-Leger", "Julien Flamant",
    "Fred Mbissi", "Celestin StLouis", "Matthias Clouet", "Damien Rollet",
    "John Vigues", "Yann Villefroy", "Laurent Sabatier", "Thomas Strazzacappa",
    "Areski Bouaziz",
  ],
};

// Catégories de jeunes : nom abrégé publiquement
const JEUNES = new Set([
  "u6-u7", "u8-u9", "u10-u11", "u12-u13", "u14-u15", "pole-feminin-jeune",
]);

function couper(complet: string) {
  const m = complet.trim().split(/\s+/);
  return { prenom: m[0], nom: m.slice(1).join(" ") };
}

async function main() {
  /* --- Bureau --- */
  await prisma.boardMember.deleteMany({});
  for (const [i, b] of BUREAU.entries()) {
    await prisma.boardMember.create({
      data: { firstName: b.p, lastName: b.n, role: b.role, group: b.g, order: i },
    });
  }
  console.log("Bureau :", BUREAU.length, "membres");

  /* --- Encadrement --- */
  await prisma.staff.deleteMany({});
  for (const s of STAFF) {
    const team = s.team ? await prisma.team.findUnique({ where: { slug: s.team } }) : null;
    await prisma.staff.create({
      data: {
        firstName: s.p,
        lastName: s.n,
        role: s.role,
        teamId: team?.id ?? null,
      },
    });
  }
  console.log("Encadrement :", STAFF.length, "personnes");

  /* --- Joueurs --- */
  let crees = 0;
  let conserves = 0;

  for (const [slug, noms] of Object.entries(JOUEURS)) {
    const team = await prisma.team.findUnique({ where: { slug } });
    if (!team) {
      console.log(`  (ignoré : catégorie "${slug}" introuvable)`);
      continue;
    }

    // On ne supprime jamais une fiche reliée à un compte
    const proteges = await prisma.player.findMany({
      where: { teamId: team.id, userId: { not: null } },
      select: { firstName: true, lastName: true },
    });
    conserves += proteges.length;

    await prisma.player.deleteMany({ where: { teamId: team.id, userId: null } });

    const dejaLa = new Set(
      proteges.map((p) => `${p.firstName} ${p.lastName}`.toLowerCase().trim())
    );

    for (const complet of noms) {
      if (dejaLa.has(complet.toLowerCase().trim())) continue;
      const { prenom, nom } = couper(complet);
      await prisma.player.create({
        data: {
          firstName: prenom,
          lastName: nom,
          teamId: team.id,
          nameDisplay: (JEUNES.has(slug) ? "INITIALE" : "COMPLET") as NameDisplay,
        },
      });
      crees++;
    }
    console.log(`  ${team.name} : ${noms.length} joueurs`);
  }

  console.log(`\nJoueurs créés : ${crees} · fiches conservées (comptes reliés) : ${conserves}`);
  console.log("Les jeunes sont en « prénom + initiale » — modifiable dans Admin > Effectifs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
