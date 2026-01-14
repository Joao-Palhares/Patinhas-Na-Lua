"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
  if (completedCount === 1) {

    // FETCH DYNAMIC SETTING
    const settings = await db.businessSettings.findFirst();
    const discount = settings?.referralRewardPercentage || 5; // Default to 5 if not set

    const referrer = await db.user.findUnique({
       where: { id: user.referredById },
       select: { name: true, email: true } // Need name for code
    });

    if (referrer) {
      // Generate Code: REF-JOAO-9482
      const namePart = referrer.name 
        ? referrer.name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) 
        : "AMIGO";
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const code = `REF-${namePart}-${randomPart}`;

      await db.coupon.create({
        data: {
          code: code,
          discount: discount, // DYNAMIC DISCOUNT
          active: true,
          userId: user.referredById
        }
      });
      console.log(`[Referral] Created Coupon ${code} (${discount}%) for referrer ${user.referredById}`);
    }
  }
}

import { requireAdmin } from "@/lib/auth";

// 1. Create Manual Appointment
export async function createManualAppointment(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  const id = formData.get("id") as string;
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as any; // Cast as ANY to avoid build error if enum missing

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
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.appointment.delete({ where: { id } });
  revalidatePath("/admin/appointments");
}

// 4. Send Test Email
export async function sendTestEmailAction(email: string) {
  await requireAdmin(); // Secure this too to avoid spam
  try {
    const { sendBookingConfirmation } = await import("@/lib/email");
    await sendBookingConfirmation({
      to: email,
      userName: "Teste Admin",
      petName: "Rex (Teste)",
      serviceName: "Banho de Teste",
      dateStr: new Date().toLocaleDateString("pt-PT"),
      timeStr: "12:00",
      appointmentDate: new Date(),
      durationMinutes: 30
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao enviar email" };
  }
}

// 5. TIMER MANAGEMENT
export async function startAppointment(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.appointment.update({
    where: { id },
    data: { actualStartTime: new Date() }
  });
  revalidatePath("/admin/appointments");
}

export async function finishAppointment(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.appointment.update({
    where: { id },
    data: { finishedAt: new Date() }
  });
  revalidatePath("/admin/appointments");
}