/**
 * Bornes du prochain week-end sportif.
 * Du vendredi soir au dimanche soir : c'est là que se jouent les matchs.
 * En semaine, on affiche le week-end qui arrive ; le dimanche, celui du jour.
 */
export function bornesWeekend(maintenant = new Date()) {
  const jour = maintenant.getDay(); // 0 = dimanche, 6 = samedi

  const debut = new Date(maintenant);
  debut.setHours(0, 0, 0, 0);

  if (jour === 0) {
    // Dimanche : on reste sur le week-end en cours
    debut.setDate(debut.getDate() - 2);
  } else if (jour === 6) {
    debut.setDate(debut.getDate() - 1);
  } else {
    // Du lundi au vendredi : on vise le vendredi à venir
    debut.setDate(debut.getDate() + (5 - jour));
  }

  const fin = new Date(debut);
  fin.setDate(fin.getDate() + 2);
  fin.setHours(23, 59, 59, 999);

  return { debut, fin };
}

/** Vrai si le week-end visé est celui en cours. */
export function weekendEnCours(maintenant = new Date()) {
  const jour = maintenant.getDay();
  return jour === 0 || jour === 6 || jour === 5;
}
