import webpush from "web-push";
import { prisma } from "./prisma";

let pret = false;

function init() {
  if (pret) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@usanizypinon.fr",
    pub,
    priv
  );
  pret = true;
  return true;
}

type Message = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Envoie une notification aux comptes donnes.
 * Les abonnements expires sont nettoyes automatiquement.
 */
export async function envoyerNotification(userIds: string[], message: Message) {
  if (!init() || userIds.length === 0) return { envoyees: 0 };

  const abonnements = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? "/",
  });

  let envoyees = 0;
  const perimes: string[] = [];

  await Promise.all(
    abonnements.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          payload
        );
        envoyees++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404 / 410 : l'abonnement n'existe plus cote navigateur
        if (code === 404 || code === 410) perimes.push(a.id);
      }
    })
  );

  if (perimes.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: perimes } } });
  }

  return { envoyees };
}

/** Comptes a prevenir pour un match : ceux qui suivent cette categorie. */
export async function destinatairesMatch(teamId: string) {
  const users = await prisma.user.findMany({
    where: {
      notifyMatches: true,
      subscriptions: { some: {} },
      favorites: { some: { id: teamId } },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/** Comptes a prevenir pour une actualite : tous ceux qui les acceptent. */
export async function destinatairesActu() {
  const users = await prisma.user.findMany({
    where: { notifyNews: true, subscriptions: { some: {} } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
