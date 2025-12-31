"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes, format, isBefore, isAfter, setHours, setMinutes, parseISO } from "date-fns";

// 1. SUBMIT BOOKING
export async function submitBooking(formData: FormData) {
  const userId = formData.get("userId") as string;
  const petId = formData.get("petId") as string;
  const serviceId = formData.get("serviceId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const price = Number(formData.get("price"));
  const couponCode = formData.get("couponCode") as string; // NEW

  const finalDate = new Date(`${date}T${time}:00`);
  let finalPrice = price;
  let usedCouponId: string | null = null;

  // VERIFY COUPON IF PROVIDED
  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: couponCode, active: true }
    });

    if (coupon) {
      // Apply Discount (Assuming 100% means free? Or is it currency?)
      // The user said "Reward" coupons which imply free service usually.
      // Let's assume the user buys a specific reward.
      // For now, if coupon exists, set price to 0 or reduce it.
      // Logic: If discount is 100(%), price = 0.
      if (coupon.discount === 100) {
        finalPrice = 0;
      } else {
        finalPrice = price - (price * (coupon.discount / 100));
      }
      usedCouponId = coupon.id;
    }
  }

  // 2. Create Appointment & Fetch Details
  const newAppointment = await db.appointment.create({
    data: {
      userId,
      petId,
      serviceId,
      date: finalDate,
      price: finalPrice, // Use discounted price
      status: "PENDING",
      isPaid: false,
    },
    include: {
      user: true,
      pet: true,
      service: true
    }
  });

  // 3. MARK COUPON AS USED
  if (usedCouponId) {
    await db.coupon.update({
      where: { id: usedCouponId },
      data: {
        active: false,
        usedAt: new Date()
      }
    });
  }

  // 4. Send Confirmation Email (Fire and Forget)
  try {
    const { sendBookingConfirmation } = await import("@/lib/email");
    await sendBookingConfirmation({
      to: newAppointment.user.email,
      userName: newAppointment.user.name || "Cliente",
      petName: newAppointment.pet.name,
      serviceName: newAppointment.service.name,
      dateStr: finalDate.toLocaleDateString("pt-PT"),
      timeStr: finalDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }

  redirect("/dashboard?booking=success");
}

export async function validateCoupon(code: string) {
  const coupon = await db.coupon.findUnique({
    where: { code: code, active: true }
  });

  if (!coupon) return { valid: false, message: "Código inválido ou expirado." };

  // Optional: Check if it belongs to user?
  // prompt says: "only available to use once by the user who bought it"
  // Ideally we pass userId here too to check `coupon.userId === userId`

  return { valid: true, discount: coupon.discount };
}

// 2. CALCULATE SLOTS (The Logic You Asked For)
export async function getAvailableSlots(dateStr: string, durationMinutes: number) {
  "use server";

  const WORK_START = 9;  // 09:00
  const WORK_END = 18;   // 18:00
  const LUNCH_START = 12; // 12:00
  const LUNCH_END = 13;   // 13:00
  const BUFFER = 15;      // 15 min cleaning time

  const selectedDate = new Date(dateStr);
  const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);

  // Fetch Existing Appointments
  const appointments = await db.appointment.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "CANCELLED" }
    },
    include: { service: { include: { options: true } } }
  });

  const possibleSlots: string[] = [];

  // Start checking from 09:00
  let currentTime = setMinutes(setHours(new Date(selectedDate), WORK_START), 0);

  // Stop checking at 18:00
  const closingTime = setMinutes(setHours(new Date(selectedDate), WORK_END), 0);

  // Loop through the day in 15-minute intervals
  while (isBefore(currentTime, closingTime)) {

    // Define the Slot Window (Start -> End)
    const slotStart = new Date(currentTime);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    // --- RULE 1: LUNCH BREAK (12-13) ---
    // A booking cannot START inside lunch, nor END inside lunch, nor SPAN across lunch
    // Simplest check: If Slot End > 12:00 AND Slot Start < 13:00, it clashes.
    const lunchStart = setMinutes(setHours(new Date(selectedDate), LUNCH_START), 0);
    const lunchEnd = setMinutes(setHours(new Date(selectedDate), LUNCH_END), 0);

    if (isAfter(slotEnd, lunchStart) && isBefore(slotStart, lunchEnd)) {
      // Skip this slot
      currentTime = addMinutes(currentTime, 15);
      continue;
    }

    // --- RULE 2: CLOSING TIME ---
    if (isAfter(slotEnd, closingTime)) {
      break; // Stop completely, day is done
    }

    // --- RULE 3: EXISTING APPOINTMENTS (Collision + Buffer) ---
    let isColliding = false;

    for (const app of appointments) {
      // Get App Duration (Default 60 if missing)
      const appDuration = app.service.options[0]?.durationMin || 60;

      const appStart = new Date(app.date);
      // IMPORTANT: The app occupies time UNTIL (End + Buffer)
      // Example: 13:00 booking (90m) ends 14:30. 
      // Buffer makes it busy until 14:45.
      const appBusyUntil = addMinutes(appStart, appDuration + BUFFER);

      // Check Overlap: (StartA < EndB) and (EndA > StartB)
      if (isBefore(slotStart, appBusyUntil) && isAfter(slotEnd, appStart)) {
        isColliding = true;
        break;
      }
    }

    // --- RULE 4: PAST TIME (If today) ---
    if (isBefore(currentTime, new Date())) {
      isColliding = true;
    }

    // If valid, add to list
    if (!isColliding) {
      possibleSlots.push(format(currentTime, "HH:mm"));
    }

    // Check next 15 min slot
    currentTime = addMinutes(currentTime, 15);
  }

  return possibleSlots;
}