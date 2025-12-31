"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function redeemReward(rewardCost: number, rewardName: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "User not logged in" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { success: false, message: "User not found" };

    if (dbUser.loyaltyPoints < rewardCost) {
        return { success: false, message: "Pontos insuficientes" };
    }

    try {
        // 1. Deduct Points
        await db.user.update({
            where: { id: user.id },
            data: { loyaltyPoints: { decrement: rewardCost } }
        });

        // 2. Generate Long Random Code (REWARD-XXXXXXXX-XXXXXXXX-XXXXXXXX)
        const part1 = Math.random().toString(36).substring(2, 10).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 10).toUpperCase();
        const part3 = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code = `REWARD-${part1}-${part2}-${part3}`;

        // 3. Create Coupon linked to USER
        await db.coupon.create({
            data: {
                code: code,
                discount: 100,
                active: true,
                userId: user.id
            }
        });

        revalidatePath("/dashboard");
        return { success: true, code: code };

    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao processar pedido" };
    }
}
