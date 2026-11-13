import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { synchroniser, passageRecent, noterPassage } from "@/lib/sportcorico-sync";
import { synchroniserJeunesICS } from "@/lib/sportcorico-ics-sync";
import { synchroniserPlateaux } from "@/lib/sportcorico-plateaux";
import { auth, canEdit } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const DELAI_MINUTES = 10;

/** Accès réservé au cron externe via CRON_SECRET, ou à un dirigeant connecté.
 * Jamais de synchronisation anonyme par ?auto=1 : elle consomme des ressources
 * et permettait à n'importe quel visiteur de bloquer les synchronisations.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const test = url.searchParams.get("test") === "1";
  const auto = url.searchParams.get("auto") === "1";
  const secret = process.env.CRON_SECRET;
  const signe = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!signe) {
    // Le cron automatisé n'accepte JAMAIS une session navigateur.
    if (auto) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    const session = await auth();
    if (!canEdit(session?.user?.role)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (auto && !test && await passageRecent(DELAI_MINUTES)) {
    return NextResponse.json({ ignore: true, raison: "Synchronisation récente." });
  }

  const erreurs: Record<string, string> = {};
  let crees = 0;
  let modifies = 0;
  let rapportPublic: Awaited<ReturnType<typeof synchroniser>> | null = null;
  let ics: Awaited<ReturnType<typeof synchroniserJeunesICS>> | null = null;
  let plateaux: Awaited<ReturnType<typeof synchroniserPlateaux>> | null = null;

  // Une erreur d'un fournisseur n'empêche pas les autres lectures.
  try {
    rapportPublic = await synchroniser({ test });
    crees += rapportPublic.crees;
    modifies += rapportPublic.modifies;
  } catch (e) {
    erreurs.public = e instanceof Error ? e.message : "Erreur de synchronisation publique";
  }
  try {
    ics = await synchroniserJeunesICS(test);
    crees += ics.crees;
    modifies += ics.modifies;
  } catch (e) {
    erreurs.ics = e instanceof Error ? e.message : "Erreur du calendrier ICS";
  }
  try {
    plateaux = await synchroniserPlateaux(test);
    modifies += plateaux.modifies;
    if (plateaux.erreurs.length) erreurs.plateaux = `${plateaux.erreurs.length} plateau(x) en erreur`;
  } catch (e) {
    erreurs.plateaux = e instanceof Error ? e.message : "Erreur des plateaux";
  }

  const auMoinsUnSucces = rapportPublic !== null || ics !== null || (plateaux?.lus ?? 0) > 0;
  if (!test && auMoinsUnSucces) {
    // Une panne complète ne bloque plus les prochains essais pendant 10 minutes.
    await noterPassage();
    if (crees + modifies > 0) {
      revalidatePath("/");
      revalidatePath("/matchs");
      revalidatePath("/equipes");
      revalidatePath("/admin/matchs");
    }
  }

  const resultat = {
    test,
    crees,
    modifies,
    public: rapportPublic,
    ics: ics && { actif: ics.actif, lus: ics.lus, classes: ics.classes, crees: ics.crees, modifies: ics.modifies, conflits: ics.conflits },
    plateaux,
    erreurs,
  };
  return NextResponse.json(resultat, { status: auMoinsUnSucces ? 200 : 503 });
}
