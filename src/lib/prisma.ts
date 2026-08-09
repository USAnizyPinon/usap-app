import { PrismaClient } from "@prisma/client";

// En dev, Next recharge le code a chaque sauvegarde : on garde une seule
// instance Prisma pour ne pas ouvrir des dizaines de connexions.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
