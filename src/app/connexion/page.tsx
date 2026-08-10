import Link from "next/link";
import SignInButton from "@/components/SignInButton";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  const session = await auth();
  if (session) redirect("/mon-espace");

  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-12">
      <div className="card w-full max-w-md text-center">
        <p className="eyebrow justify-center">Espace licencié</p>
        <h1 className="title mt-4 text-2xl">Se connecter</h1>
        <p className="mt-3 text-sm text-cream/65">
          Connectez-vous avec votre compte Google pour accéder à votre espace. Les dirigeants
          gèrent en plus le calendrier, les effectifs et les actualités.
        </p>

        <div className="mt-7">
          <SignInButton />
        </div>

        <p className="mt-6 text-xs text-cream/40">
          Nous utilisons uniquement votre nom, votre email et votre photo de profil Google.
          En vous connectant, vous acceptez notre{" "}
          <Link href="/confidentialite" className="underline hover:text-jaune">
            politique de confidentialité
          </Link>{" "}
          et nos{" "}
          <Link href="/mentions-legales" className="underline hover:text-jaune">
            mentions légales
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
