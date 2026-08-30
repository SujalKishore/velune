import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma_v6: PrismaClient };

export const prisma = globalForPrisma.prisma_v6 ?? new PrismaClient({ adapter: new PrismaLibSql({ url: "file:./dev.db" }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v6 = prisma;
}
