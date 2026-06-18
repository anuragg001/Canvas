import {PrismaPg} from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";


// to prevent from multiple instances of prisma client being created in development, we store the instance in a global variable
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient  | undefined
}

//used to create prisma instance only once in development to prevent multiple instances of prisma client being created and causing issues with hot reloading
function createPrismaClient(){
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
    });

    return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;