import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// On ajoute id + role a la session pour les retrouver partout.
declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}
