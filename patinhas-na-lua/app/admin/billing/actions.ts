"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";

// STEP 1: UPDATE OR CREATE DRAFT
// STEP 1: UPDATE OR CREATE DRAFT
export async function saveBillingDraft(
  appointmentId: string, 
  basePrice: number, 
  extraFees: { id: string; price: number }[],
  notes: string
) {
  await requireAdmin();
  
  // 1. Update Appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: { 
      groomerNotes: notes,
      price: basePrice 
    }
  });

  // 2. Clear old extra fees
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
  const extrasTotal = extraFees.reduce((acc, curr) => acc + curr.price, 0);
  const total = basePrice + extrasTotal;

  // Need User Details for Snapshot (Critical for new Schema)
  const app = await db.appointment.findUnique({ 
    where: { id: appointmentId },
    include: { user: true }
  });
  
  if (!app) return; // Should not happen

  const snapshotData = {
      invoicedName: app.user.name || "Consumidor Final",
      invoicedNif: app.user.nif || "999999990",
      invoicedEmail: app.user.email,
      invoicedAddress: app.user.address,
      taxAmount: 0 // VAT EXEMPT (Art 53)
  };

  const existingInvoice = await db.invoice.findUnique({ where: { appointmentId } });

  if (existingInvoice) {
    await db.invoice.update({
      where: { id: existingInvoice.id },
      data: { 
        subtotal: total, 
        totalAmount: total, 
        // @ts-ignore
        ...snapshotData
      }
    });
  } else {
    await db.invoice.create({
      data: {
        appointmentId,
        userId: app.userId,
        subtotal: total,
        totalAmount: total,
        status: "DRAFT",
        // @ts-ignore
        ...snapshotData
      }
    });
  }

  revalidatePath("/admin/appointments");
}

// STEP 2: UPDATE NIF
export async function updateClientNif(userId: string, nif: string) {
  await requireAdmin();
  await db.user.update({
    where: { id: userId },
    data: { nif }
  });
}

// STEP 4: ISSUE INVOICE (Facturalusa Integration)
export async function issueInvoice(appointmentId: string, paymentMethod: PaymentMethod) {
  await requireAdmin();
  
  // 1. Get Billing Data
  const invoice = await db.invoice.findUnique({ 
    where: { appointmentId },
    include: { appointment: { include: { service: true } } }
  });

  if (!invoice || !invoice.appointment) throw new Error("Invoice Draft not found");

  // 2. Prepare Payload
  const token = process.env.FACTURALUSA_API_TOKEN;
  if (!token) throw new Error("Facturalusa Token missing");

  // Use Snapshot Data
  const payload = {
    document_type: "Factura Recibo",
    // serie: REMOVED (Let API use default)
    vat_type: "IVA incluído",
    issue_date: new Date().toISOString().split('T')[0],
    client: {
        // @ts-ignore
        name: invoice.invoicedName,
        // @ts-ignore
        vat: invoice.invoicedNif,
        // @ts-ignore
        email: invoice.invoicedEmail,
        // @ts-ignore
        address: invoice.invoicedAddress,
        city: "Cidade",      // Required Default
        postal_code: "0000-000", // Required Default
        country: "PT"
    },
    items: [
        {
            reference: "SRV",
            description: invoice.appointment.service.name, // Main Service Name
            qty: 1,
            unit_price: Number(invoice.subtotal), // Base Price
            vat: "0",         // Rate is 0
            vat_exemption: "M10" // Exemption code Art 53
        }
    ],
    status: "Terminado" // Final Status
  };
  // 3. Call API
  console.log("Issuing Invoice...", payload);
  
  let externalId = "OFFLINE-" + Date.now().toString().slice(-6); // Fallback ID
  let pdfUrl = null;

  try {
      // Reverting to Non-WWW (Correct SSL) with Accept header (Correct content negotiation)
      const resApi = await fetch("https://facturalusa.pt/api/v2/sales", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json", // MANDATORY
              "Authorization": `Bearer ${token}`,
              "User-Agent": "PatinhasApp/1.0"
          },
          body: JSON.stringify(payload)
      });

      const contentType = resApi.headers.get("content-type");

      if (contentType && contentType.includes("text/html")) {
          const text = await resApi.text();
          console.error(`API HTML Error (Status ${resApi.status}): ${text.substring(0, 100)}...`);
          console.warn("⚠️ Facturalusa API unreachable/misconfigured. Using OFFLINE mode.");
          // Do not throw, allow fallback
      } else if (resApi.ok) {
          const data = await resApi.json();
          externalId = String(data.id);
          pdfUrl = data.permalink;
          console.log("✅ Invoice Issued:", externalId);
      } else {
          const errText = await resApi.text();
          console.error("❌ Facturalusa API Refused:", errText);
          // Fallback
      }
  } catch (e) {
      console.error("⚠️ Facturalusa Network/Config Error:", e);
      // Fallback proceeds
  }

  // 4. Update Database
  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "ISSUED", // Mark as Issued even if Offline
      invoiceNumber: externalId,
      externalId: externalId,
      pdfUrl: pdfUrl,
      date: new Date(),
    }
  });

  // 5. Complete Appointment
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