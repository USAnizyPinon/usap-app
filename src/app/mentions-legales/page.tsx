export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow">Informations légales</p>
      <h1 className="title mt-3">Mentions légales</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-cream/75">
        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">Éditeur</h2>
          <p className="mt-2">
            Cette application est éditée par l&apos;<b>Union Sportive Anizy-Pinon</b>,
            association sportive régie par la loi du 1<sup>er</sup> juillet 1901.
          </p>
          <ul className="mt-3 space-y-1">
            <li>Siège social : Mairie, 02320 Anizy-le-Grand</li>
            <li>SIRET : 780 159 687 00018</li>
            <li>Numéro d&apos;affiliation FFF : 502704</li>
            <li>
              Adresse électronique :{" "}
              <a
                href="mailto:usanizypinon1@gmail.com"
                className="underline hover:text-jaune"
              >
                usanizypinon1@gmail.com
              </a>
            </li>
            <li>Directrice de la publication : Lydie Broyart, présidente</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Hébergement
          </h2>
          <p className="mt-2">
            L&apos;application est hébergée par <b>Vercel Inc.</b>, 440 N Barranca Ave
            #4133, Covina, CA 91723, États-Unis. Les données sont enregistrées chez{" "}
            <b>Supabase</b>, sur des serveurs situés en Europe (Londres, Royaume-Uni).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Propriété intellectuelle
          </h2>
          <p className="mt-2">
            L&apos;écusson, le nom et les visuels du club appartiennent à
            l&apos;US Anizy-Pinon. Les logos des partenaires restent la propriété de leurs
            détenteurs respectifs et sont affichés avec leur accord. Toute reproduction
            sans autorisation est interdite.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Droit à l&apos;image
          </h2>
          <p className="mt-2">
            Les photographies de licenciés sont publiées après accord de la personne
            concernée ou, pour les mineurs, de leurs représentants légaux. Toute demande de
            retrait est traitée sans délai : écrivez à{" "}
            <a href="mailto:usanizypinon1@gmail.com" className="underline hover:text-jaune">
              usanizypinon1@gmail.com
            </a>{" "}
            en précisant la photo concernée.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Liens externes
          </h2>
          <p className="mt-2">
            L&apos;application renvoie vers des services tiers, notamment SportCorico pour
            les convocations et le suivi des rencontres. Le club n&apos;est pas responsable
            du contenu de ces services.
          </p>
        </section>
      </div>
    </div>
  );
}
