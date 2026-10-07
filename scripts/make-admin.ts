/*
 * Grants admin rights to an existing account. Admin is never granted from
 * the UI, so this is the only way in:
 *
 *   npm run make-admin -- you@example.com
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
    console.error("Usage: npm run make-admin -- you@example.com");
    process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
    console.error(`No account for ${email}. Sign up on the site first.`);
    process.exit(1);
}
await prisma.user.update({ where: { email }, data: { role: "admin" } });
console.log(`${user.name} <${email}> is now an admin.`);
await prisma.$disconnect();
