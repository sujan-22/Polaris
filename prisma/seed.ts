/*
 * Seeds the catalogue, its sellers and a few months of demo order history so
 * the studio dashboards have something to show. Safe to run on every deploy:
 * it does nothing once the catalogue exists.
 *
 *   npm run db:seed            # seed an empty database
 *   npm run db:reset           # wipe, migrate and seed again (local only)
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { computeTotals } from "../src/lib/pricing";
import { orderNumber, slugify } from "../src/lib/utils";
import { PRODUCTS, SELLERS } from "./seed-data";

config({ path: [".env.local", ".env"], quiet: true });

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/* Deterministic randomness, so every fresh database looks the same. */
function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const random = mulberry32(2026);
const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)]!;
const DAY = 24 * 60 * 60 * 1000;

/* Accounts nobody signs in to: the password is random and thrown away. */
async function createUser(data: { name: string; email: string; role: string; storeName?: string; password?: string; createdAt?: Date }) {
    const id = crypto.randomUUID();
    const password = await hashPassword(data.password ?? crypto.randomUUID());
    return prisma.user.create({
        data: {
            id,
            name: data.name,
            email: data.email,
            emailVerified: true,
            role: data.role,
            storeName: data.storeName,
            createdAt: data.createdAt,
            accounts: {
                create: { id: crypto.randomUUID(), accountId: id, providerId: "credential", password },
            },
        },
    });
}

async function seedAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) return;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        if (existing.role !== "admin") await prisma.user.update({ where: { email }, data: { role: "admin" } });
        return;
    }
    await createUser({ name: "Polaris Admin", email, role: "admin", password });
    console.log(`  admin    ${email}`);
}

/*
 * Products with a range of sizes lose the odd one to "sold out", so the
 * product page has something to show; single-variant products always stock.
 * The desk lamp is sold out entirely, to exercise that state too.
 */
function stockFor(name: string, variantCount: number): number {
    if (name === "Desk Lamp") return 0;
    if (variantCount >= 3 && random() < 0.18) return 0;
    const stock = 2 + Math.floor(random() * 30);
    return random() < 0.15 ? Math.min(stock, 3) : stock;
}

async function seedCatalogue() {
    const sellers = new Map<string, string>();
    for (const seller of SELLERS) {
        const user = await createUser({
            name: seller.name,
            email: `${seller.key}@sellers.polaris.example`,
            role: "seller",
            storeName: seller.storeName,
            createdAt: new Date(Date.now() - 400 * DAY),
        });
        sellers.set(seller.key, user.id);
    }

    // Newer shelves get newer timestamps so "Newest" sorts sensibly.
    const count = PRODUCTS.length;
    for (const [index, product] of PRODUCTS.entries()) {
        const age = product.collection === "new_arrivals" ? index : count + index * 3;
        const createdAt = new Date(Date.now() - age * DAY - 7 * DAY);
        await prisma.product.create({
            data: {
                slug: slugify(product.name),
                name: product.name,
                description: product.description,
                details: product.details,
                category: product.category,
                collection: product.collection,
                priceCents: Math.round(product.price * 100),
                compareAtCents: product.compareAt ? Math.round(product.compareAt * 100) : null,
                sellerId: sellers.get(product.seller)!,
                createdAt,
                images: {
                    create: product.images.map(([file, color], position) => ({
                        url: `/products/${file}.webp`,
                        color: color ?? null,
                        position,
                    })),
                },
                variants: {
                    create: product.colors.flatMap((color) =>
                        product.sizes.map((size) => ({
                            color,
                            size,
                            stock: stockFor(product.name, product.colors.length * product.sizes.length),
                        })),
                    ),
                },
            },
        });
    }
    console.log(`  catalogue ${count} products from ${SELLERS.length} sellers`);
}

const CUSTOMERS = ["Avery", "Jordan", "Samira", "Theo", "Mei", "Lucas", "Noor", "Elena"];
const CITIES = [
    ["Toronto", "ON", "M5V 2T6"],
    ["Hamilton", "ON", "L8P 4R5"],
    ["Ottawa", "ON", "K1P 5G4"],
    ["Montréal", "QC", "H2X 1Y4"],
    ["Vancouver", "BC", "V6B 1A1"],
    ["Halifax", "NS", "B3J 1S9"],
] as const;

/* Paid orders spread over the last four months, for the dashboards. */
async function seedOrderHistory() {
    const customers = [];
    for (const name of CUSTOMERS) {
        customers.push(
            await createUser({
                name,
                email: `${name.toLowerCase()}@customers.polaris.example`,
                role: "user",
                createdAt: new Date(Date.now() - 200 * DAY),
            }),
        );
    }

    const variants = await prisma.variant.findMany({
        where: { stock: { gt: 0 } },
        include: { product: { include: { images: { orderBy: { position: "asc" } } } } },
    });

    let orders = 0;
    for (let daysAgo = 120; daysAgo >= 0; daysAgo--) {
        // Busier recently, and busier at weekends.
        const day = new Date(Date.now() - daysAgo * DAY);
        const weekend = day.getDay() === 0 || day.getDay() === 6;
        const expected = 0.35 + (120 - daysAgo) / 140 + (weekend ? 0.4 : 0);
        const todays = Math.floor(expected + random());
        for (let n = 0; n < todays; n++) {
            const customer = pick(customers);
            const lines = Array.from({ length: 1 + Math.floor(random() * 2.4) }, () => pick(variants));
            const unique = [...new Map(lines.map((v) => [v.id, v])).values()];
            const items = unique.map((variant) => ({
                variant,
                quantity: random() < 0.82 ? 1 : 2,
                image: (variant.product.images.find((i) => i.color === variant.color) ?? variant.product.images[0])?.url,
            }));
            const totals = computeTotals(items.map((i) => ({ unitPriceCents: i.variant.product.priceCents, quantity: i.quantity })));
            const createdAt = new Date(day.getTime() - Math.floor(random() * 10 * 60 * 60 * 1000));
            const fulfillment = daysAgo > 12 ? "delivered" : daysAgo > 3 ? "shipped" : "unfulfilled";
            const [city, state, postalCode] = pick([...CITIES]);
            await prisma.order.create({
                data: {
                    number: orderNumber(),
                    userId: customer.id,
                    email: customer.email,
                    status: "paid",
                    ...totals,
                    paidAt: createdAt,
                    createdAt,
                    shippingAddress: {
                        name: customer.name,
                        line1: `${10 + Math.floor(random() * 880)} King Street West`,
                        city,
                        state,
                        postalCode,
                        country: "CA",
                    },
                    items: {
                        create: items.map(({ variant, quantity, image }) => ({
                            productId: variant.productId,
                            variantId: variant.id,
                            sellerId: variant.product.sellerId,
                            name: variant.product.name,
                            slug: variant.product.slug,
                            image,
                            color: variant.color,
                            size: variant.size,
                            unitPriceCents: variant.product.priceCents,
                            quantity,
                            fulfillment,
                            shippedAt: fulfillment === "unfulfilled" ? null : new Date(createdAt.getTime() + 2 * DAY),
                            deliveredAt: fulfillment === "delivered" ? new Date(createdAt.getTime() + 6 * DAY) : null,
                        })),
                    },
                },
            });
            orders++;
        }
    }

    // One application waiting for review, so the admin queue isn't empty.
    await prisma.sellerRequest.create({
        data: {
            userId: customers[2]!.id,
            storeName: "Paper Moon",
            pitch: "Hand-bound notebooks and letterpress cards, printed in small runs in my studio in Hamilton.",
        },
    });

    console.log(`  orders   ${orders} paid orders from ${customers.length} customers`);
}

async function main() {
    console.log("Seeding Polaris…");
    await seedAdmin();
    if ((await prisma.product.count()) > 0) {
        console.log("  catalogue already seeded, leaving it alone");
        return;
    }
    await seedCatalogue();
    await seedOrderHistory();
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
