"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes, format, isBefore, isAfter, setHours, setMinutes, parseISO, addWeeks } from "date-fns";
import * as crypto from "crypto";

import { currentUser } from "@clerk/nextjs/server";

// 1. SUBMIT BOOKING
export async function submitBooking(formData: FormData) {
  const userAuth = await currentUser();
  if (!userAuth) return redirect("/");

  const userId = formData.get("userId") as string;
  
  // 1. AUTH CHECK: Ensure user is booking for themselves
  if (userAuth.id !== userId) {
    throw new Error("Unauthorized: Cannot book for another user.");
  }

  // 2. RATE LIMITING (Max 3 bookings per 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const attempts = await db.rateLimit.count({
    where: { key: userId, createdAt: { gte: tenMinutesAgo } }
  });
  if (attempts >= 3) {
    return redirect("/dashboard?error=ratelimit");
  }
  await db.rateLimit.create({ data: { key: userId } });

  const petId = formData.get("petId") as string;
  const serviceId = formData.get("serviceId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const price = Number(formData.get("price"));
  const couponCode = formData.get("couponCode") as string;

  // 0. CHECK BLACKLIST
  // @ts-ignore: Prisma Client update pending
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user?.isBlacklisted) {
     return redirect("/dashboard?error=blacklisted");
  }

  // RECURRENCE
  const isRecurring = formData.get("isRecurring") === "true";

  // Locations
  const locationType = formData.get("locationType") as "SALON" | "MOBILE" || "SALON";
  const mobileAddress = formData.get("mobileAddress") as string;
  const travelFee = Number(formData.get("travelFee") || 0);

  const baseDate = new Date(`${date}T${time}:00`);
  let recurrenceGroupId = isRecurring ? crypto.randomUUID() : null;

  let discountPercent = 0;
  let usedCouponId: string | null = null;
  let referralIdToLink: string | null = null;
  let discountNotes = couponCode ? `Código: ${couponCode}` : null;

  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: couponCode, active: true }
    });

    if (coupon) {
      if (coupon.usesCount >= coupon.maxUses) {
         // Should fail ideally, but let's just ignore discount to not break flow? 
         // Or safer to throw err? Let's ignore discount.
         discountPercent = 0;
         discountNotes = `Cupão ${couponCode} expirado (limite atingido)`;
      } else {
         discountPercent = coupon.discount;
         usedCouponId = coupon.id;
         
         // Increment Use Count
         await db.coupon.update({
             where: { id: coupon.id },
             data: { usesCount: { increment: 1 } }
         });
      }

    } else {
      // @ts-ignore: Prisma Client not generated yet
      const referrer = await db.user.findFirst({ where: { referralCode: couponCode } });
      if (referrer) {
        discountPercent = 5;
        referralIdToLink = referrer.id;
      }
    }
  }
  
  // AUTO-APPLY REFERRAL DISCOUNT (If First Booking & No Coupon Used)
  // If user didn't type a coupon, but WAS referred on registration, give them the 5% automatically on first booking.
  if (discountPercent === 0 && !couponCode) {
     const userDb = await db.user.findUnique({ 
         where: { id: userId },
         include: { appointments: true } // Check history
     });
     
     if (userDb && userDb.referredById && userDb.appointments.length === 0) {
         discountPercent = 5;
         discountNotes = "Desconto de Referência (Automático)";
     }
  }

  // LINK REFERRAL (Once)
  if (referralIdToLink && referralIdToLink !== userId) {
    await db.user.update({
      where: { id: userId },
      // @ts-ignore: Prisma Client not generated yet
      data: { referredById: referralIdToLink }
    }).catch(() => { });
  }

  // MARK COUPON USED (Once)
  if (usedCouponId) {
    await db.coupon.update({
      where: { id: usedCouponId },
      data: { active: false, usedAt: new Date() }
    });
  }

  // CREATE APPOINTMENTS (Loop)
  // User requested "registers this time and one more only" -> Total 2
  const count = isRecurring ? 2 : 1;
  let firstAppointmentId = "";

  for (let i = 0; i < count; i++) {
    const appointmentDate = addWeeks(baseDate, i * 4);

    // Calculate Price for this instance
    let finalPrice = price;
    if (discountPercent === 100) {
      finalPrice = 0;
    } else if (discountPercent > 0) {
      finalPrice = price - (price * (discountPercent / 100));
    }

    const newApp = await db.appointment.create({
      data: {
        userId,
        petId,
        serviceId,
        date: appointmentDate,
        price: finalPrice,
        originalPrice: price,
        discountNotes,
        status: "PENDING",
        isPaid: false,

        locationType,
        mobileAddress,
        travelFee,

        isRecurring: isRecurring,
        recurrenceGroupId: recurrenceGroupId
      } as any
    });

    if (i === 0) firstAppointmentId = newApp.id;
  }

  // 4. Send Confirmation Email (Only for the first one)
  try {
    // Re-fetch included data for email
    const firstApp = await db.appointment.findUnique({
      where: { id: firstAppointmentId },
      include: { 
        user: true, 
        pet: true, 
        service: {
            include: { options: true }
        } 
      }
    });

    if (firstApp) {
      // Determine Duration based on Pet Size
      const matchedOption = firstApp.service.options.find(opt => opt.petSize === firstApp.pet.sizeCategory);
      const duration = matchedOption?.durationMin || firstApp.service.options[0]?.durationMin || 60;

      const { sendBookingConfirmation } = await import("@/lib/email");
      await sendBookingConfirmation({
        to: firstApp.user.email,
        userName: firstApp.user.name || "Cliente",
        petName: firstApp.pet.name,
        serviceName: firstApp.service.name + (isRecurring ? " (Série de 6 meses)" : ""),
        dateStr: firstApp.date.toLocaleDateString("pt-PT"),
        timeStr: firstApp.date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        // Calendar Invite Data
        appointmentDate: firstApp.date,
        durationMinutes: duration,
        appointmentId: firstApp.id
      });
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }

  redirect("/dashboard?booking=success");
}

export async function validateCoupon(code: string) {
  // 1. Check Standard Coupons (Main Priority)
  const coupon = await db.coupon.findUnique({
    where: { code: code, active: true }
  });

  if (coupon) {
    if (coupon.usesCount >= coupon.maxUses) {
       return { valid: false, message: "Este cupão atingiu o limite de utilizações." };
    }
    return { valid: true, discount: coupon.discount, type: "COUPON", id: coupon.id };
  }

  // 2. Check Referral Codes (Secondary Priority)
  const referrer = await db.user.findFirst({
    where: { referralCode: code } as any
  });

  if (referrer) {
    // Check if user is NEW (First Booking)
    // We need userId to check this. Ensure validateCoupon is called with userId.
    // If we assume this function is called within a context where we can check currentUser:
    const user = await currentUser();
    if (user) {
         const existingApps = await db.appointment.count({
             where: { userId: user.id }
         });
         if (existingApps > 0) {
             return { valid: false, message: "O código de convite é exclusivo para a primeira marcação." };
         }
    }
    return { valid: true, discount: 5, type: "REFERRAL", id: referrer.id };
  }

  return { valid: false, message: "Código inválido ou expirado." };
}

// 2. CALCULATE SLOTS (The Logic You Asked For)
export async function getAvailableSlots(dateStr: string, durationMinutes: number) {
  "use server";

  // CONSTANTS (Defaults)
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

  // Parse start/end times with safety check
  const startStr = workingDay.startTime || "09:00";
  const endStr = workingDay.endTime || "18:00";

  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  // Parse Break Times (Robust Inputs)
  // Logic: If user clears break times, we respect it (No Break).
  let breakStartStr = workingDay.breakStartTime;
  let breakEndStr = workingDay.breakEndTime;

  if (!breakStartStr || breakStartStr === "") {
    // No break defined -> Set break to be same as end time (effectively no break)
    breakStartStr = endStr;
    breakEndStr = endStr;
  } else if (!breakEndStr || breakEndStr === "") {
    // Break starts but has no end -> End immediately
    breakEndStr = breakStartStr;
  }

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
    // Also ignore zero-length breaks (lunchStart === lunchEnd)
    if (lunchStart.getTime() !== lunchEnd.getTime()) {
      if (isBefore(slotStart, lunchEnd) && isAfter(slotEnd, lunchStart)) {
        // Skip this slot
        currentTime = addMinutes(currentTime, 15);
        continue;
      }
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

export async function getMonthAvailability(year: number, month: number) {
  "use server";

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const availabilityMap: Record<string, number> = {};

  const promises = [];
  const dateKeys: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dateKeys.push(dateStr);
    promises.push(getAvailableSlots(dateStr, 60));
  }

  const results = await Promise.all(promises);
  results.forEach((slots, index) => {
    availabilityMap[dateKeys[index]] = slots.length;
  });

  return availabilityMap;
}