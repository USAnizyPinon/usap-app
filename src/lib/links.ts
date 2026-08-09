/**
 * SportCorico gere les convocations, les presences et le score en direct.
 * On ne redeveloppe pas ces fonctions : on renvoie vers l'outil du club.
 * Mettre l'URL de la page du club dans NEXT_PUBLIC_SPORTCORICO_URL.
 */
export const SPORTCORICO_URL =
  process.env.NEXT_PUBLIC_SPORTCORICO_URL || "https://www.sportcorico.com";

export const SPORTCORICO_IOS =
  "https://apps.apple.com/fr/app/sportcorico/id1622205781";
export const SPORTCORICO_ANDROID =
  "https://play.google.com/store/apps/details?id=com.sportcorico.app";
