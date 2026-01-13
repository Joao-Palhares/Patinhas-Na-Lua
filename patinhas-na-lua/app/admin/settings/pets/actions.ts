"use server";
import { db } from "@/lib/db";
import { PetSize } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function togglePetSizeRule(formData: FormData) {
    const size = formData.get("size") as PetSize;
    const isActiveStr = formData.get("isActive") as string;
    const isActive = isActiveStr === 'true';

    if (!size) return;

    try {
        await db.petSizeRule.upsert({
            where: { size: size },
            update: { isActive },
            create: { size, isActive }
        });

        revalidatePath("/admin/settings/pets");
    } catch (error) {
        console.error("Error toggling pet rule:", error);
    }
}
