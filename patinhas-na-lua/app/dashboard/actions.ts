"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function cancelAppointment(appointmentId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // Verify ownership
    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment || appointment.userId !== user.id) {
        throw new Error("Unauthorized or Not Found");
    }

    await db.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" }
    });

    revalidatePath("/dashboard");
}
