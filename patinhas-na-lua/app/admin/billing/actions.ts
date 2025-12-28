"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

// STEP 1: UPDATE OR CREATE DRAFT
export async function saveBillingDraft(
  appointmentId: string, 
  basePrice: number, 
  extraFees: { id: string; price: number }[],
  notes: string
) {
  // 1. Update Appointment Notes & Price
  await db.appointment.update({
    where: { id: appointmentId },
    data: { 
      groomerNotes: notes,
      price: basePrice // Update base price if changed
    }
  });

  // 2. Clear old extra fees (simple way to update)
  await db.appointmentExtraFee.deleteMany({
    where: { appointmentId }
  });

  // 3. Add new extra fees
  if (extraFees.length > 0) {
    await db.appointmentExtraFee.createMany({
      data: extraFees.map(fee => ({
        appointmentId,
        extraFeeId: fee.id,
        appliedPrice: fee.price,
        quantity: 1
      }))
    });
  }

  // 4. Create/Update Invoice as DRAFT
  // Calculate Total
  const extrasTotal = extraFees.reduce((acc, curr) => acc + curr.price, 0);
  const total = basePrice + extrasTotal;

  // Check if invoice exists
  const existingInvoice = await db.invoice.findUnique({ where: { appointmentId } });

  if (existingInvoice) {
    await db.invoice.update({
      where: { id: existingInvoice.id },
      data: { subtotal: total, totalAmount: total, status: "DRAFT" }
    });
  } else {
    // We need the userId
    const app = await db.appointment.findUnique({ where: { id: appointmentId } });
    if (app) {
      await db.invoice.create({
        data: {
          appointmentId,
          userId: app.userId,
          subtotal: total,
          totalAmount: total,
          status: "DRAFT"
        }
      });
    }
  }

  revalidatePath("/admin/appointments");
}

// STEP 2: UPDATE NIF
export async function updateClientNif(userId: string, nif: string) {
  await db.user.update({
    where: { id: userId },
    data: { nif }
  });
}

// STEP 4: ISSUE INVOICE (Simulated)
export async function issueInvoice(appointmentId: string, paymentMethod: PaymentMethod) {
  
  // 1. Generate Fake Invoice Number (In real life, call API)
  const count = await db.invoice.count();
  const invoiceNo = `FT 2025/${count + 1}`;

  // 2. Finalize Invoice
  await db.invoice.update({
    where: { appointmentId },
    data: {
      status: "ISSUED",
      invoiceNumber: invoiceNo,
      date: new Date(),
    }
  });

  // 3. Complete Appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      isPaid: true,
      paidAt: new Date(),
      paymentMethod: paymentMethod
    }
  });

  revalidatePath("/admin/appointments");
}