"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

// 1. Create Manual Appointment
export async function createManualAppointment(formData: FormData) {
  const userId = formData.get("userId") as string;
  const petId = formData.get("petId") as string;
  const serviceId = formData.get("serviceId") as string;
  const dateStr = formData.get("date") as string; // "2024-12-25"
  const timeStr = formData.get("time") as string; // "14:30"
  const price = Number(formData.get("price"));

  // Combine Date + Time into ISO DateTime
  const finalDate = new Date(`${dateStr}T${timeStr}:00`);

  await db.appointment.create({
    data: {
      userId,
      petId,
      serviceId,
      date: finalDate,
      price: price, // Admin sets the price manually
      status: "CONFIRMED", // Admin bookings are auto-confirmed
    }
  });

  revalidatePath("/admin/appointments");
}

// 2. Update Status (e.g., "Completed")
export async function updateAppointmentStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  if (!status) return; // Prevent the crash

  await db.appointment.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/appointments");
}

// 2. REGISTER PAYMENT (New dedicated action)
export async function registerPayment(formData: FormData) {
  const id = formData.get("id") as string;
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as PaymentMethod;

  await db.appointment.update({
    where: { id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      price: amount,
      paymentMethod: method,
      status: "COMPLETED" // <--- ADD THIS LINE. Force status to Completed.
    }
  });

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/analytics"); // Update analytics too
}

// 3. Delete
export async function deleteAppointment(formData: FormData) {
  const id = formData.get("id") as string;
  await db.appointment.delete({ where: { id } });
  revalidatePath("/admin/appointments");
}

// 4. Send Test Email
export async function sendTestEmailAction(email: string) {
  try {
    const { sendBookingConfirmation } = await import("@/lib/email");
    await sendBookingConfirmation({
      to: email,
      userName: "Teste Admin",
      petName: "Rex (Teste)",
      serviceName: "Banho de Teste",
      dateStr: new Date().toLocaleDateString("pt-PT"),
      timeStr: "12:00"
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao enviar email" };
  }
}