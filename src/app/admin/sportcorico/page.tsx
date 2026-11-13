import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { dernierPassage } from "@/lib/sportcorico-sync";
import SyncPanel from "./SyncPanel";

export const dynamic = "force-dynamic";

export default async function AdminSportCoricoPage() {
  const [equipes, dernier, verrouilles] = await Promise.all([
    prisma.team.findMany({ orderBy: { order: "asc" } }),
    dernierPassage(),
    prisma.match.count({ where: { scoreLocked: true } }),
  ]);

  const branchees = equipes.filter((e) => e.sportcoricoUrl);

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="font-display text-xl font-black uppercase">
          Scores récupérés sur SportCorico
        </h2>
        <p className="mt-2 text-sm text-cream/70">
          Les résultats saisis dans SportCorico pendant le match sont publiés sur la page
          de chaque équipe. L&apos;application va les y relire et remplit les scores toute
          seule, sans que personne ait à les retaper ici.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-cream/60">
          <li>• Le rapprochement se fait sur la date du match, pas sur le nom de l&apos;adversaire.</li>
          <li>• Un score saisi à la main est conservé : la synchronisation ne l&apos;écrase jamais.</li>
          <li>
            • Une notification part uniquement pour un résultat des dernières 48 h, pour ne
            pas réveiller tout le club avec la saison entière.
          </li>
        </ul>
        <p className="mt-4 text-xs text-cream/45">
          Dernier passage :{" "}
          {dernier ? (
            <span className="capitalize text-cream/70">{formatDateTime(dernier)}</span>
          ) : (
            "jamais"
          )}
          {verrouilles > 0 && ` · ${verrouilles} score(s) saisi(s) à la main et protégé(s)`}
        </p>
      </div>

      <section>
        <h3 className="font-display text-lg font-black uppercase">Catégories branchées</h3>
        {branchees.length === 0 ? (
          <div className="card mt-4">
            <p className="text-sm text-cream/70">
              Aucune catégorie n&apos;est encore reliée à SportCorico. Ouvrez la page
              SportCorico de l&apos;équipe, copiez son adresse, et collez-la dans{" "}
              <Link href="/admin/equipes" className="font-bold text-jaune hover:underline">
                Créneaux
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {branchees.map((e) => (
              <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold">{e.name}</span>
                <a
                  href={e.sportcoricoUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-full truncate text-xs text-cream/50 hover:text-jaune"
                >
                  {e.sportcoricoUrl}
                </a>
              </li>
            ))}
          </ul>
        )}
        {equipes.length > branchees.length && (
          <p className="mt-3 text-xs text-cream/45">
            {equipes.length - branchees.length} catégorie(s) sans page SportCorico : leurs
            scores restent à saisir à la main.{" "}
            <Link href="/admin/equipes" className="font-bold text-jaune hover:underline">
              Les relier
            </Link>
          </p>
        )}
      </section>

      <SyncPanel actif={branchees.length > 0} />
    </div>
  );
}
