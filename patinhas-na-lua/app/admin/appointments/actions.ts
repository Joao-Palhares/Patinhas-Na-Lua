"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

// HELPER: PROCESS REFERRAL REWARD
// Give 10 points to referrer if this is the user's FIRST completed appointment
async function processReferralReward(userId: string) {
  // 1. Check if user was referred
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referredById: true }
  });

  if (!user || !user.referredById) return;

  // 2. Check if this is the FIRST completed appointment
  // We count how many completed appointments exist. 
  // If we just marked one as completed, the count is >= 1.
  // We want to know if there were ANY *before* this action (or if this is the only one).

  const completedCount = await db.appointment.count({
    where: {
      userId: userId,
      status: "COMPLETED"
    }
  });

  // If this is the FIRST one (Count is 1), reward the referrer.
  // Note: This relies on "processReferralReward" being called AFTER the status update.
  if (completedCount === 1) {
    await db.user.update({
      where: { id: user.referredById },
      data: {
        loyaltyPoints: { increment: 10 }
      }
    });
    console.log(`[Referral] Rewarded referrer ${user.referredById} with 10 points.`);
  }
}

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

  const appointment = await db.appointment.update({
    where: { id },
    data: { status },
    select: { userId: true } // Need this for referral check
  });

  if (status === "COMPLETED") {
    await processReferralReward(appointment.userId);
  }

  revalidatePath("/admin/appointments");
}

// 2. REGISTER PAYMENT (New dedicated action)
export async function registerPayment(formData: FormData) {
  const id = formData.get("id") as string;
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as PaymentMethod;

  const appointment = await db.appointment.update({
    where: { id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      price: amount,
      paymentMethod: method,
      status: "COMPLETED"
    },
    select: { userId: true }
  });

  await processReferralReward(appointment.userId);

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