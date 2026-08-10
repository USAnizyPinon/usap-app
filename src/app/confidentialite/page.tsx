export const metadata = { title: "Confidentialité" };

export default function ConfidentialitePage() {
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow">Vos données</p>
      <h1 className="title mt-3">Confidentialité</h1>
      <p className="mt-5 text-cream/70">
        L&apos;US Anizy-Pinon s&apos;engage à limiter la collecte de données au strict
        nécessaire au fonctionnement de l&apos;application.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-cream/75">
        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Ce que nous collectons
          </h2>
          <p className="mt-2">
            Lorsque vous vous connectez avec Google, nous recevons votre <b>nom</b>, votre{" "}
            <b>adresse électronique</b> et votre <b>photo de profil</b>. Nous
            n&apos;accédons jamais à votre mot de passe, à vos messages ni à vos contacts.
          </p>
          <p className="mt-3">Selon votre usage, nous enregistrons également :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>les catégories que vous suivez et vos réglages de notification ;</li>
            <li>
              votre abonnement aux notifications, si vous les activez (un identifiant
              technique fourni par votre navigateur) ;
            </li>
            <li>vos inscriptions aux événements du club ;</li>
            <li>
              les informations transmises dans une demande pour rejoindre le club (prénom,
              nom, catégorie, photo si vous en ajoutez une).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">Pourquoi</h2>
          <p className="mt-2">
            Ces informations servent uniquement à faire fonctionner l&apos;application :
            vous identifier, afficher les effectifs, vous prévenir des matchs et
            actualités que vous avez choisis, et gérer les inscriptions aux événements.
            Aucune donnée n&apos;est vendue, louée ni utilisée à des fins publicitaires.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">Qui y a accès</h2>
          <p className="mt-2">
            Seuls les dirigeants du club disposant d&apos;un compte administrateur peuvent
            consulter les comptes et les inscriptions. Les pages publiques n&apos;affichent
            que les informations destinées à l&apos;être : nom d&apos;affichage et photo
            des licenciés selon les réglages choisis.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Combien de temps
          </h2>
          <p className="mt-2">
            Les données de votre compte sont conservées tant que vous l&apos;utilisez. Si
            vous demandez sa suppression, elles sont effacées sous trente jours. Les
            informations sportives (matchs, résultats) sont conservées pour l&apos;histoire
            du club.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">Vos droits</h2>
          <p className="mt-2">
            Conformément au règlement général sur la protection des données, vous pouvez
            demander l&apos;accès à vos données, leur correction, leur suppression, ou vous
            opposer à leur traitement. Écrivez à l&apos;adresse de contact indiquée dans
            les mentions légales. Vous pouvez également saisir la CNIL.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">
            Photographies des mineurs
          </h2>
          <p className="mt-2">
            Aucune photo de licencié mineur n&apos;est publiée sans l&apos;accord écrit de
            ses représentants légaux. Le club peut à tout moment masquer une photo ou
            n&apos;afficher qu&apos;un prénom. Pour toute demande de retrait, contactez le
            club : elle sera traitée sans délai.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-black uppercase text-cream">Cookies</h2>
          <p className="mt-2">
            L&apos;application dépose uniquement un cookie de session, indispensable pour
            vous garder connecté. Aucun cookie publicitaire ni traceur tiers n&apos;est
            utilisé.
          </p>
        </section>
      </div>
    </div>
  );
}
