import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Simple approach: Use standard Prisma Client
// Neon's pooler connection handles serverless connections well
// The issue was likely connection string format, not needing the adapter

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;