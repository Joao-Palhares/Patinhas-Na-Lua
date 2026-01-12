import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Check Query Param ?format=csv
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  // 2. Fetch DATA (Same as before)
  const users = await db.user.findMany();
  const pets = await db.pet.findMany();
  const appointments = await db.appointment.findMany();
  const invoices = await db.invoice.findMany();
  const expenses = await db.expense.findMany();
  const services = await db.service.findMany();

  // If JSON requested (Default)
  if (format !== "csv") {
    // ... fetch remaining tables for JSON complete backup ...
     const appointmentImages = await db.appointmentImage.findMany();
     const appointmentExtraFees = await db.appointmentExtraFee.findMany();
     const serviceOptions = await db.serviceOption.findMany();
     const businessSettings = await db.businessSettings.findFirst();
     const workingDays = await db.workingDay.findMany();
     const absences = await db.absence.findMany();
     const extraFees = await db.extraFee.findMany();
     const coupons = await db.coupon.findMany();
     const loyaltyRewards = await db.loyaltyReward.findMany();
     const reviews = await db.review.findMany();
     const portfolioImages = await db.portfolioImage.findMany();
     const pushSubscriptions = await db.pushSubscription.findMany();
     const rateLimits = await db.rateLimit.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      users, pets, appointments, appointmentImages, appointmentExtraFees,
      services, serviceOptions, businessSettings, workingDays, absences,
      expenses, extraFees, invoices, coupons, loyaltyRewards, reviews,
      portfolioImages, pushSubscriptions, rateLimits
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  }

  // 3. CSV GENERATION (Flattened Critical Data)
  // CSV is hard for relational data (multiple tables). We will generate a ZIP containing multiple CSVs? 
  // Or just a single CSV of the most important table (Appointments)?
  // Let's assume you want meaningful business data readable in Excel: APPOINTMENTS + USERS

  // Helper to escape CSV fields
  const escapeMsg = (str: any) => `"${String(str || "").replace(/"/g, '""')}"`;

  // APPOINTMENTS CSV
  const header = "ID,Date,Client Name,Client Phone,Pet Name,Service,Price,Status,IsPaid,Payment Method\n";
  
  // We need to map relations manually since we fetched separately (or use include)
  // Re-fetch appointments with relations for easier CSV mapping
  const richAppointments = await db.appointment.findMany({
    include: { user: true, pet: true, service: true }
  });

  const rows = richAppointments.map(app => {
    return [
      app.id,
      app.date.toISOString(),
      escapeMsg(app.user.name),
      escapeMsg(app.user.phone),
      escapeMsg(app.pet.name),
      escapeMsg(app.service.name),
      app.price,
      app.status,
      app.isPaid ? "Yes" : "No",
      app.paymentMethod || ""
    ].join(",");
  });

  const csvContent = header + rows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-appointments-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
