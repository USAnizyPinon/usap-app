import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

/** Emails declares dans ADMIN_EMAILS : promus ADMIN a la connexion. */
function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "database" },
  pages: { signIn: "/connexion" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: Role }).role ?? "LICENCIE";
      }
      return session;
    },
  },
  events: {
    // Promotion automatique des emails listes dans ADMIN_EMAILS.
    async signIn({ user }) {
      if (isAdminEmail(user.email) && (user as { role?: Role }).role !== "ADMIN") {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
    },
    async createUser({ user }) {
      if (isAdminEmail(user.email)) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }

      // À la création, on suit toutes les catégories :
      // la personne affine ensuite depuis Mon espace.
      const equipes = await prisma.team.findMany({ select: { id: true } });
      if (equipes.length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { favorites: { connect: equipes.map((e) => ({ id: e.id })) } },
        });
      }
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

/** true si le compte peut modifier le contenu du club. */
export function canEdit(role?: Role | string | null) {
  return role === "ADMIN" || role === "DIRIGEANT";
}

/** A utiliser en haut des pages/actions reservees aux dirigeants. */
export async function requireEditor() {
  const session = await auth();
  if (!session?.user || !canEdit(session.user.role)) {
    throw new Error("NON_AUTORISE");
  }
  return session;
}
