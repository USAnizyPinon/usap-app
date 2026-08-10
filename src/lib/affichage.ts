import type { NameDisplay } from "@prisma/client";

/**
 * Droit a l'image : le nom affiche publiquement depend du reglage du joueur.
 * Utile notamment pour les categories de jeunes.
 */
export function nomPublic(p: {
  firstName: string;
  lastName: string;
  nameDisplay: NameDisplay;
}) {
  const nom = p.lastName?.trim() ?? "";
  if (p.nameDisplay === "PRENOM" || nom === "") return p.firstName;
  if (p.nameDisplay === "INITIALE") return `${p.firstName} ${nom.charAt(0).toUpperCase()}.`;
  return `${p.firstName} ${nom}`;
}

/** La photo n'est montree que si le joueur (ou ses parents) l'autorise. */
export function photoPublique(p: { photo: string | null; publicPhoto: boolean }) {
  return p.publicPhoto ? p.photo : null;
}
