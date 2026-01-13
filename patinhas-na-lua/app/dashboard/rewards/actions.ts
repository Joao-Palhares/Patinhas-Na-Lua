"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function redeemReward(rewardId: string, petId?: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "Utilizador não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { success: false, message: "Utilizador não encontrado" };

    // 1. Fetch the Reward with Service Options context
    const reward = await db.loyaltyReward.findUnique({
        where: { id: rewardId },
        include: { 
            service: {
                include: { options: true }
            }
        }
    });

    if (!reward) return { success: false, message: "Prémio não encontrado" };
    if (!reward.isActive) return { success: false, message: "Este prémio já não está disponível" };

    let pointsCost = reward.pointsCost;

    // --- DYNAMIC REWARD LOGIC ---
    if (pointsCost <= 0) {
        if (!petId) {
            return { success: false, message: "Erro: É necessário selecionar um animal para este prémio." };
        }

        const pet = await db.pet.findUnique({ where: { id: petId } });
        if (!pet) return { success: false, message: "Animal não encontrado." };
        
        // Ensure Pet has size/coat data
        if (!pet.sizeCategory || !pet.coatType) {
            return { success: false, message: "Por favor atualize o perfil do seu animal (Tamanho e Pelo) para usar este prémio." };
        }

        // Find Matching Option
        const matchedOption = reward.service.options.find(o => 
            o.petSize === pet.sizeCategory && 
            o.coatType === pet.coatType
        );

        if (!matchedOption) {
            return { success: false, message: "Este serviço não está disponível para o tamanho/pelo do seu animal." };
        }

        // Calculate Cost: Price * 20
        pointsCost = Math.ceil(Number(matchedOption.price) * 20);
    }

    // Check Balance
    if (dbUser.loyaltyPoints < pointsCost) {
        return { success: false, message: `Pontos insuficientes. Necessita de ${pointsCost} patinhas.` };
    }

    try {
        // 2. Deduct Points
        await db.user.update({
            where: { id: user.id },
            data: { loyaltyPoints: { decrement: pointsCost } }
        });

        // 3. Create Coupon code
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `LUA-${part1}-${part2}`; 

        // 4. Create Coupon
        await db.coupon.create({
            data: {
                code: code,
                discount: reward.discountPercentage || 0, // Usually 100 for free services
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
