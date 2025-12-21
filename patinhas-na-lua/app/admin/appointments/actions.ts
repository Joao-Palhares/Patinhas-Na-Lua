"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
  const isPaid = formData.get("isPaid") === "true"; // Checkbox logic

  await db.appointment.update({
    where: { id },
    data: { 
      status, 
      isPaid: isPaid ? true : undefined, // Only update if true, or handle toggle logic
      paidAt: isPaid ? new Date() : null
    }
  });
  
  revalidatePath("/admin/appointments");
}

// 3. Delete
export async function deleteAppointment(formData: FormData) {
  const id = formData.get("id") as string;
  await db.appointment.delete({ where: { id } });
  revalidatePath("/admin/appointments");
}