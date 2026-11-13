import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { synchroniser, passageRecent, noterPassage } from "@/lib/sportcorico-sync";
import { auth, canEdit } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Lecture de plusieurs pages a la suite : la valeur par defaut serait trop courte.
export const maxDuration = 60;

/** Delai minimum entre deux relectures declenchees par l'application. */
const DELAI_MINUTES = 15;

/**
 * Relit les scores publies par SportCorico et met nos matchs a jour.
 *
 * Trois facons d'arriver ici :
 *  - l'appel quotidien signe par Vercel (voir vercel.json) ;
 *  - le bouton « Synchroniser maintenant » de l'espace d'administration ;
 *  - ?auto=1, declenche par la page Matchs quand quelqu'un la consulte.
 *
 * Le troisieme est le plus utile : le forfait gratuit de Vercel ne permet
 * qu'un seul passage planifie par jour, alors que la consultation d'une page
 * suffit a rafraichir les scores dans le quart d'heure qui suit un match.
 *
 * ?test=1 : montre ce qui serait fait, sans rien enregistrer.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const test = url.searchParams.get("test") === "1";
  const auto = url.searchParams.get("auto") === "1";

  const secret = process.env.CRON_SECRET;
  const signe = secret ? req.headers.get("authorization") === `Bearer ${secret}` : true;

  // Le mode automatique est ouvert a tous, mais strictement limite en frequence.
  if (!signe && !auto) {
    const session = await auth();
    if (!canEdit(session?.user?.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  if (auto) {
    if (await passageRecent(DELAI_MINUTES)) {
      return NextResponse.json({ ignore: true, raison: "Déjà relu récemment." });
    }
    // On note l'heure avant de commencer : deux visiteurs simultanes ne
    // doivent pas declencher deux lectures.
    await noterPassage();
  }

  try {
    const rapport = await synchroniser({ test });

    if (!test) {
      if (!auto) await noterPassage();
      if (rapport.ecrits > 0) {
        revalidatePath("/");
        revalidatePath("/matchs");
        revalidatePath("/equipes");
        revalidatePath("/admin/matchs");
      }
    }

    return NextResponse.json(rapport);
  } catch (e) {
    const cause = e instanceof Error ? e.message : "cause inconnue";
    return NextResponse.json({ error: `Synchronisation impossible (${cause}).` }, { status: 500 });
  }
}

