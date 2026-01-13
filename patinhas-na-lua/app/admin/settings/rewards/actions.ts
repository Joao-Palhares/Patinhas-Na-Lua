"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addReward(formData: FormData) {
    const serviceId = formData.get("serviceId") as string;
    const pointsCost = Number(formData.get("pointsCost"));
    const discountPercentage = Number(formData.get("discountPercentage") || 100);
    // Handle optional decimal field
    const rawMaxDiscount = formData.get("maxDiscountAmount");
    const maxDiscountAmount = rawMaxDiscount ? Number(rawMaxDiscount) : null;
    
    // NEW: Optional Specific Option
    const serviceOptionId = formData.get("serviceOptionId") as string || null;

    // Simple validation (Allow 0 for Dynamic Rewards)
    if (!serviceId || pointsCost < 0) return;

    // Now securely using Prisma Client which handles createdAt/updatedAt automatically
    await db.loyaltyReward.create({
        data: {
            serviceId,
            serviceOptionId, // NEW
            pointsCost,
            discountPercentage,
            maxDiscountAmount,
            isActive: true,
        }
    });

    revalidatePath("/admin/settings/rewards");
}

export async function deleteReward(formData: FormData) {
    const id = formData.get("id") as string;

    await db.loyaltyReward.delete({
        where: { id }
    });

    revalidatePath("/admin/settings/rewards");
}
