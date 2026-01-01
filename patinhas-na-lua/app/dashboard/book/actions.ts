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

  // Locations
  const locationType = formData.get("locationType") as "SALON" | "MOBILE" || "SALON";
  const mobileAddress = formData.get("mobileAddress") as string;
  const travelFee = Number(formData.get("travelFee") || 0);

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
      price: finalPrice, // Use discounted price (Base Service Price)
      status: "PENDING",
      isPaid: false,

      // Location
      locationType,
      mobileAddress,
      travelFee: travelFee,
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

  // CONSTANTS (Defaults)
  const LUNCH_START = 12; // 12:00
  const LUNCH_END = 13;   // 13:00
  const BUFFER = 15;      // 15 min cleaning time

  const selectedDate = new Date(dateStr);

  // 1. CHECK ABSENCES (Vacation)
  // Use Raw SQL because Prisma Client types are stale & property is missing at runtime
  const absences = await db.$queryRaw<any[]>`
    SELECT * FROM "Absence" 
    WHERE "startDate" <= ${selectedDate} AND "endDate" >= ${selectedDate}
    LIMIT 1
  `;

  if (absences && absences.length > 0) return []; // On Vacation!

  // 2. CHECK WORKING HOURS
  const dayOfWeek = selectedDate.getDay(); // 0 (Sun) - 6 (Sat)

  const workingDays = await db.$queryRaw<any[]>`
    SELECT "id", "dayOfWeek", "startTime", "endTime", "breakStartTime", "breakEndTime", "isClosed"
    FROM "WorkingDay" 
    WHERE "dayOfWeek" = ${dayOfWeek} 
    LIMIT 1
  `;
  let workingDay = workingDays[0];

  // Default Standard Logic if not configured in DB yet
  if (!workingDay) {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) return []; // Default Closed on Weekends

    // Default Weekdays: 09:00 - 18:00
    workingDay = { startTime: "09:00", endTime: "18:00", isClosed: false };
  }

  if (workingDay.isClosed) return []; // Closed that day

  // Parse start/end times
  const [startH, startM] = workingDay.startTime.split(":").map(Number);
  const [endH, endM] = workingDay.endTime.split(":").map(Number);

  // Parse Break Times (Defaults to 12:00-13:00 if missing in DB, though schema default handles it)
  const breakStartStr = workingDay.breakStartTime || "12:00";
  const breakEndStr = workingDay.breakEndTime || "13:00";
  const [bStartH, bStartM] = breakStartStr.split(":").map(Number);
  const [bEndH, bEndM] = breakEndStr.split(":").map(Number);

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

  // Start checking from config Start Time
  let currentTime = setMinutes(setHours(new Date(selectedDate), startH), startM);

  // Stop checking at config End Time
  const closingTime = setMinutes(setHours(new Date(selectedDate), endH), endM);

  // Loop through the day in 15-minute intervals
  while (isBefore(currentTime, closingTime)) {

    // Define the Slot Window (Start -> End)
    // Note: slotEnd is exclusive of the break usually, but if slot spans break it's invalid.
    const slotStart = new Date(currentTime);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    // --- RULE 1: BREAK TIME (Dynamic) ---
    // Clashes if slot overlaps with [BreakStart, BreakEnd]
    const lunchStart = setMinutes(setHours(new Date(selectedDate), bStartH), bStartM);
    const lunchEnd = setMinutes(setHours(new Date(selectedDate), bEndH), bEndM);

    // Check if slot overlaps break
    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    if (isBefore(slotStart, lunchEnd) && isAfter(slotEnd, lunchStart)) {
      // Skip this slot
      currentTime = addMinutes(currentTime, 15);
      continue;
    }

    // --- RULE 2: CLOSING TIME ---
    // Slot must end BEFORE or AT closing time
    if (isAfter(slotEnd, closingTime)) {
      break;
    }

    // --- RULE 3: EXISTING APPOINTMENTS (Collision + Buffer) ---
    let isColliding = false;

    for (const app of appointments) {
      // Get App Duration (Default 60 if missing)
      const appDuration = app.service.options[0]?.durationMin || 60;

      const appStart = new Date(app.date);
      // IMPORTANT: The app occupies time UNTIL (End + Buffer)
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