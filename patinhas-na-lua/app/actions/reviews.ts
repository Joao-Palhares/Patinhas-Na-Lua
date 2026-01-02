"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function submitReview(appointmentId: string, rating: number, comment: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // Validate ownership
    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment || appointment.userId !== user.id) {
        throw new Error("Agendamento não encontrado ou sem permissão.");
    }

    // Create Review
    await db.review.create({
        data: {
            appointmentId,
            rating,
            comment,
            isPublic: false // pending moderation
        }
    });

    // Optional: Notify Admin?

    revalidatePath("/dashboard");
    return { success: true };
}
