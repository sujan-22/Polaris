import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const orderInclude = {
    items: { orderBy: { name: "asc" } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/* Abandoned checkouts stay out of the history; only paid orders show. */
export async function getCustomerOrders(userId: string, take?: number): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
        where: { userId, status: "paid" },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        take,
    });
}

export async function getCustomerOrder(userId: string, id: string): Promise<OrderWithItems | null> {
    return prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
}
