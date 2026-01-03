"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCouponAction(formData: FormData) {
    const code = formData.get("code") as string;
    const discount = Number(formData.get("discount"));
    const userId = formData.get("userId") as string;

    if (!code || !discount) {
        return { error: "Código e Desconto são obrigatórios." };
    }

    try {
        await db.coupon.create({
            data: {
                code: code.toUpperCase(),
                discount,
                active: true,
                userId: userId || undefined, // Handle optional user
            }
        });
        revalidatePath("/admin/coupons");
        return { success: true };
    } catch (error) {
        console.error("Failed to create coupon:", error);
        return { error: "Erro ao criar cupão. O código pode já existir ou o utilizador ser inválido." };
    }
}
