"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export async function updateUserProfile(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const nif = formData.get("nif") as string;

    await db.user.update({
        where: { id: user.id },
        data: {
            name,
            phone,
            address,
            nif
        }
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard"); // Update wherever user info is shown
}
