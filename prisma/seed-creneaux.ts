/**
 * Créneaux d'entraînement et contacts, repris de l'affiche « Portes ouvertes ».
 * Lancer avec :  npm run db:creneaux
 * Relançable sans risque : met simplement les informations à jour.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INFOS: Record<
  string,
  {
    birthYears: string;
    trainDays: string;
    trainHours: string;
    restartDate: string;
    venue: string;
    contactTel: string;
  }
> = {
  "u6-u7": {
    birthYears: "2020-2021",
    trainDays: "Mercredi",
    trainHours: "17h30-19h",
    restartDate: "Mercredi 2 septembre",
    venue: "Stade d'Anizy",
    contactTel: "07 86 37 52 00",
  },
  "u8-u9": {
    birthYears: "2018-2019",
    trainDays: "Mercredi",
    trainHours: "17h30-19h",
    restartDate: "Mercredi 2 septembre",
    venue: "Stade de Pinon",
    contactTel: "07 88 57 90 08",
  },
  "u10-u11": {
    birthYears: "2016-2017",
    trainDays: "Mardi & Jeudi",
    trainHours: "17h30-19h",
    restartDate: "Mardi 25 août",
    venue: "Stade d'Anizy",
    contactTel: "07 88 57 90 08",
  },
  "u12-u13": {
    birthYears: "2014-2015",
    trainDays: "Mardi & Jeudi",
    trainHours: "17h30-19h",
    restartDate: "Mardi 18 août",
    venue: "Stade de Pinon",
    contactTel: "06 95 49 49 20",
  },
  "pole-feminin-jeune": {
    birthYears: "2015 à 2018",
    trainDays: "Mardi & Jeudi",
    trainHours: "17h30-19h",
    restartDate: "Mardi 18 août",
    venue: "Stade de Pinon",
    contactTel: "07 49 35 81 18",
  },
  "u14-u15": {
    birthYears: "2012-2013",
    trainDays: "Lundi & Mercredi",
    trainHours: "17h30-19h",
    restartDate: "Lundi 17 août",
    venue: "Stade d'Anizy",
    contactTel: "06 33 00 06 94",
  },
  "u16-u18": {
    birthYears: "2009-2010-2011",
    trainDays: "Mercredi & Vendredi",
    trainHours: "19h-20h30",
    restartDate: "Mercredi 5 août",
    venue: "Stade d'Anizy",
    contactTel: "06 95 49 49 20",
  },
  seniors: {
    birthYears: "2009 et avant",
    trainDays: "Mercredi & Vendredi",
    trainHours: "19h-20h30",
    restartDate: "Mercredi 5 août",
    venue: "Stade d'Anizy",
    contactTel: "06 82 40 45 73",
  },
  "feminines-seniors": {
    birthYears: "2009 et avant",
    trainDays: "Mardi & Jeudi",
    trainHours: "19h-20h30",
    restartDate: "Mardi 11 août",
    venue: "Stade de Pinon",
    contactTel: "07 84 84 36 70",
  },
  veterans: {
    birthYears: "35 ans et +",
    trainDays: "Dimanche",
    trainHours: "Matin",
    restartDate: "Dimanche 9 août",
    venue: "Stade d'Anizy",
    contactTel: "06 59 31 87 66",
  },
};

async function main() {
  for (const [slug, info] of Object.entries(INFOS)) {
    const team = await prisma.team.findUnique({ where: { slug } });
    if (!team) {
      console.log(`  (ignoré : catégorie "${slug}" introuvable)`);
      continue;
    }
    await prisma.team.update({ where: { slug }, data: info });
    console.log("→", team.name);
  }
  console.log("Créneaux enregistrés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
