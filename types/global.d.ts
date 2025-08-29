import { PrismaClient } from './app/generated/prisma'; // Adjust path as needed

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}
