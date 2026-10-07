import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads env files itself. Mirror Next.js: .env.local wins.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Migrations need a direct connection; Neon's pooled URL is for the app.
        url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    },
});
