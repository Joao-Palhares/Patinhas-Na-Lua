"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function redeemReward(rewardId: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "Utilizador não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { success: false, message: "Utilizador não encontrado" };

    // 1. Fetch the Reward
    // We use raw query or prisma findUnique if defined. It seems 'LoyaltyReward' was created via SQL/Migration in page.tsx 
    // so it might not be in Prisma Client Schema yet?
    // If it's not in Prisma Schema, we MUST use $queryRaw.
    // The previous page.tsx used $queryRaw, suggesting it's NOT in Prisma Schema properly or was added manually.

    // Let's try raw query for safety.
    const rewards = await db.$queryRaw<any[]>`
        SELECT * FROM "LoyaltyReward" WHERE id = ${rewardId} LIMIT 1
    `;
    const reward = rewards[0];

    if (!reward) return { success: false, message: "Prémio não encontrado" };

    if (!reward.isActive) return { success: false, message: "Este prémio já não está disponível" };

    if (dbUser.loyaltyPoints < reward.pointsCost) {
        return { success: false, message: "Pontos insuficientes" };
    }

    try {
        // 2. Deduct Points
        await db.user.update({
            where: { id: user.id },
            data: { loyaltyPoints: { decrement: reward.pointsCost } }
        });

        // 3. Create Coupon code
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `LUA-${part1}-${part2}`; // Shorter, cleaner code

        // 4. Create Coupon
        // Discount logic: If reward.discountPercentage is e.g. 100, coupon is 100% off.
        // We assume discountPercentage is the DISCOUNT amount.
        await db.coupon.create({
            data: {
                code: code,
                discount: reward.discountPercentage || 0,
                active: true,
                userId: user.id
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/rewards");
        return { success: true, code: code };

    } catch (error) {
        console.error("Redeem error:", error);
        return { success: false, message: "Erro ao processar resgate. Tente novamente." };
    }
}
