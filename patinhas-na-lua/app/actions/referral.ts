"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function generateReferralCode() {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const dbUser = await db.user.findUnique({
        where: { id: user.id },
    });

    if (!dbUser) return { error: "User not found" };
    if (dbUser.referralCode) return { success: dbUser.referralCode };

    // Generate Code: First 3 letters of name (or "USER") + random 4 digits
    const prefix = (dbUser.name?.slice(0, 3).toUpperCase() || "PAT") + "FRIEND";
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${prefix}${uniqueSuffix}`;

    try {
        await db.user.update({
            where: { id: user.id },
            data: { referralCode: code },
        });
        revalidatePath("/dashboard");
        return { success: code };
    } catch (error) {
        console.error("Error creating referral code:", error);
        return { error: "Could not generate code. Try again." };
    }
}
