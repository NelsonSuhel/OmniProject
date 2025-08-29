console.log('DEBUG_DATABASE_URL:', process.env.DATABASE_URL);
import { PrismaClient } from '@prisma/client';

// Add a type declaration for the global object
declare global {
  var prisma: PrismaClient | undefined; // Use 'var' for global variables
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
