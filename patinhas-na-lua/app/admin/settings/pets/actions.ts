"use server";
import { db } from "@/lib/db";
import { PetSize } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function togglePetSizeRule(formData: FormData) {
    const size = formData.get("size") as PetSize;
    const species = (formData.get("species") as string) || "DOG";
    const isActiveStr = formData.get("isActive") as string;
    const isActive = isActiveStr === 'true';

    if (!size) return;

    try {
        // Use Raw SQL for robust Upsert even if Client Types are stale
        const newId = crypto.randomUUID();

        // Note: We cast species to "Species" enum
        await db.$executeRaw`
            INSERT INTO "PetSizeRule" ("id", "size", "species", "isActive", "updatedAt")
            VALUES (${newId}, ${size}::"PetSize", ${species}::"Species", ${isActive}, NOW())
            ON CONFLICT ("size", "species") 
            DO UPDATE SET "isActive" = ${isActive}, "updatedAt" = NOW();
        `;

        revalidatePath("/admin/settings/pets");

        // --- AUTOMATIC CANCELLATION LOGIC ---
        if (!isActive) {
            // Find future appointments for this disabled category
            // We use Prisma Client here for convenience as Appointment model is stable
            const impactedAppointments = await db.appointment.findMany({
                where: {
                    date: { gte: new Date() }, // Future only
                    status: { in: ["PENDING", "APPROVED"] },
                    pet: {
                        sizeCategory: size,
                        species: species as any // Cast to Species (or any to avoid TS issues with enums)
                    }
                },
                include: { pet: true, user: true, service: true }
            });

            if (impactedAppointments.length > 0) {
                console.log(`Cancelling ${impactedAppointments.length} appointments for ${species} ${size}...`);
                
                for (const appt of impactedAppointments) {
                    // 1. Mark as Cancelled in DB
                    await db.appointment.update({
                        where: { id: appt.id },
                        data: {
                            status: "CANCELLED",
                            groomerNotes: (appt.groomerNotes || "") + "\n[Sistema] Cancelado por indisponibilidade temporária da categoria."
                        }
                    });

                    // 2. Send Email Notification
                    if (appt.user?.email) {
                        try {
                            const { sendAppointmentCancellation } = await import("@/lib/email");
                            await sendAppointmentCancellation({
                                to: appt.user.email,
                                userName: appt.user.name || "Cliente",
                                petName: appt.pet.name,
                                serviceName: appt.service?.name || "Serviço",
                                dateStr: appt.date.toLocaleDateString('pt-PT'),
                                timeStr: appt.date.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'}),
                                reason: "O equipamento/espaço necessário para o tamanho do seu animal encontra-se temporariamente indisponível."
                            });
                        } catch (err) {
                            console.error("Failed to send cancellation email:", err);
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error("Error toggling pet rule:", error);
    }
}
