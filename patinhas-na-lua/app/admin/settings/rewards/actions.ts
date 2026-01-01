"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addReward(formData: FormData) {
    const serviceId = formData.get("serviceId") as string;
    const pointsCost = Number(formData.get("pointsCost"));
    const discountPercentage = Number(formData.get("discountPercentage") || 100);
    const maxDiscountAmount = formData.get("maxDiscountAmount") ? Number(formData.get("maxDiscountAmount")) : null;

    // Simple validation
    if (!serviceId || !pointsCost || pointsCost <= 0) return;

    const id = crypto.randomUUID();

    await db.$executeRaw`
        INSERT INTO "LoyaltyReward" ("id", "serviceId", "pointsCost", "discountPercentage", "maxDiscountAmount", "isActive")
        VALUES (${id}, ${serviceId}, ${pointsCost}, ${discountPercentage}, ${maxDiscountAmount}, true)
    `;
    revalidatePath("/admin/settings/rewards");
}

export async function deleteReward(formData: FormData) {
    const id = formData.get("id") as string;
    await db.$executeRaw`DELETE FROM "LoyaltyReward" WHERE "id" = ${id}`;
    revalidatePath("/admin/settings/rewards");
}
