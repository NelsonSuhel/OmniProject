import { PrismaClient } from '../app/generated/prisma';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const prisma = new PrismaClient();

async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to the database!");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbConnection();
