/**
 * Partenaires du club.
 * Lancer avec :  npm run db:partners
 * Relançable sans creer de doublons.
 * Les logos sont ceux deja en ligne sur le site du club.
 */
import { PrismaClient, PartnerTier } from "@prisma/client";

const prisma = new PrismaClient();
const L = (f: string) => `https://usanizypinon.fr/${f}`;

const PARTENAIRES: {
  name: string;
  slug: string;
  logo: string;
  tier: PartnerTier;
  order: number;
  address?: string;
  description: string;
}[] = [
  {
    name: "Intermarché Anizy",
    slug: "intermarche-anizy",
    logo: L("intermarche.png"),
    tier: "PRINCIPAL",
    order: 1,
    address: "Intermarché, Anizy-le-Grand",
    description:
      "Partenaire majeur de l'USAP, acteur important de la vie locale et soutien du club. Intermarché Anizy-le-Grand accompagne le club dans ses projets sportifs et associatifs : équipement des équipes, organisation des événements et formation des jeunes licenciés.",
  },
  {
    name: "Les Fleurs de Nicolas",
    slug: "les-fleurs-de-nicolas",
    logo: L("fleurs.png"),
    tier: "PRINCIPAL",
    order: 2,
    address: "Les Fleurs de Nicolas, Anizy-le-Grand",
    description:
      "Artisan fleuriste local, partenaire engagé aux côtés de l'US Anizy Pinon. Reconnu pour la qualité de ses créations florales et son accueil chaleureux, il accompagne particuliers, associations et événements locaux tout au long de l'année.",
  },
  {
    name: "District Aisne de Football",
    slug: "district-aisne-de-football",
    logo: L("district.png"),
    tier: "OFFICIEL",
    order: 1,
    address: "District Aisne de Football, Laon",
    description:
      "Instance départementale de la Fédération Française de Football, le District Aisne encadre les compétitions et accompagne les clubs du département dans leur développement et la formation de leurs éducateurs.",
  },
  {
    name: "Crédit Agricole Anizy",
    slug: "credit-agricole-anizy",
    logo: L("credit-agricole.png"),
    tier: "OFFICIEL",
    order: 2,
    address: "Crédit Agricole, Anizy-le-Château",
    description:
      "Partenaire de proximité de l'US Anizy Pinon, le Crédit Agricole accompagne depuis de nombreuses années les particuliers, les professionnels, les associations et les acteurs du territoire. Banque coopérative fortement implantée localement, son engagement aux côtés de l'USAP participe au développement du sport, de la jeunesse et de la vie associative.",
  },
  {
    name: "Renault Anizy",
    slug: "renault-anizy",
    logo: L("renault.png"),
    tier: "OFFICIEL",
    order: 3,
    address: "Garage Renault, Anizy-le-Grand",
    description:
      "Garage automobile de proximité, partenaire du club et acteur reconnu du tissu économique local. Il accompagne l'USAP dans ses déplacements et ses projets tout au long de la saison.",
  },
  {
    name: "Commune d'Anizy-le-Grand",
    slug: "commune-anizy-le-grand",
    logo: L("anizy.png"),
    tier: "OFFICIEL",
    order: 4,
    address: "Mairie d'Anizy-le-Grand",
    description:
      "La commune d'Anizy-le-Grand soutient l'US Anizy Pinon en mettant à disposition ses installations sportives et en accompagnant le club dans la vie associative du territoire.",
  },
  {
    name: "Commune de Pinon",
    slug: "commune-de-pinon",
    logo: L("pinon.png"),
    tier: "OFFICIEL",
    order: 5,
    address: "Mairie de Pinon",
    description:
      "La commune de Pinon accompagne le club au quotidien : entretien du stade, soutien aux événements et appui à la formation des jeunes licenciés.",
  },
];

async function main() {
  for (const p of PARTENAIRES) {
    await prisma.partner.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        logo: p.logo,
        tier: p.tier,
        order: p.order,
        address: p.address ?? null,
        description: p.description,
        visible: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        logo: p.logo,
        tier: p.tier,
        order: p.order,
        address: p.address ?? null,
        description: p.description,
      },
    });
    console.log("→", p.name);
  }
  console.log("Terminé :", await prisma.partner.count(), "partenaires");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
