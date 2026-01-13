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
        // Use Raw SQL for robust Upsert even if Client Types are stale
        const newId = crypto.randomUUID();

        await db.$executeRaw`
            INSERT INTO "PetSizeRule" ("id", "size", "isActive", "updatedAt")
            VALUES (${newId}, ${size}::"PetSize", ${isActive}, NOW())
            ON CONFLICT ("size") 
            DO UPDATE SET "isActive" = ${isActive}, "updatedAt" = NOW();
        `;

        revalidatePath("/admin/settings/pets");
    } catch (error) {
        console.error("Error toggling pet rule:", error);
    }
}
