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
  const extrasTotal = extraFees.reduce((acc, curr) => acc + Number(curr.price), 0);
  const total = Number(basePrice) + extrasTotal;

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
    include: { appointment: { include: { service: true, extraFees: { include: { extraFee: true } } } } }
  });

  if (!invoice || !invoice.appointment) throw new Error("Invoice Draft not found");

  // 2. Resolve Client ID (New Logic)
  // @ts-ignore
  const clientNif = invoice.invoicedNif;
  const clientId = await resolveFacturalusaClient(
      clientNif, 
      invoice.userId, 
      {
          name: invoice.invoicedName,
          email: invoice.invoicedEmail,
          address: invoice.invoicedAddress
      }
  );

  console.log(`Resolved Facturalusa Client ID for NIF ${clientNif}: ${clientId}`);

  // 3. Prepare Payload
  const token = process.env.FACTURALUSA_API_TOKEN;
  if (!token) throw new Error("Facturalusa Token missing");

  // --- ITEMIZATION LOGIC ---
  const extras = invoice.appointment.extraFees || [];
  const extrasSum = extras.reduce((acc, curr) => acc + Number(curr.appliedPrice), 0);
  const baseServicePrice = Number(invoice.subtotal) - extrasSum;

  const items = [];

  // Item 1: Main Service
  items.push({
      id: 140539, 
      description: invoice.appointment.service.name,
      quantity: 1,
      price: baseServicePrice, 
      vat: "0",         
      vat_exemption: "M10" 
  });

  // Items 2..N: Extra Fees
  extras.forEach(fee => {
      items.push({
          id: 140539,
          description: fee.extraFee.name, // e.g. "Taxa Comportamental"
          quantity: 1,
          price: Number(fee.appliedPrice),
          vat: "0",
          vat_exemption: "M10"
      });
  });

  // Use Snapshot Data
  const payload = {
    document_type: "Factura Recibo",
    serie: Number(process.env.FACTURALUSA_SERIES_ID || 58402), 
    vat_type: "IVA incluído",
    issue_date: new Date().toISOString().split('T')[0],
    
    // Auth
    customer: clientId, 
    vat_number: clientNif, 

    items: items, // Use the detailed list
    status: "Terminado" 
  };

  // 4. Call API
  console.log("Issuing Invoice...", JSON.stringify(payload));
  
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
          // console.warn("⚠️ Facturalusa API unreachable/misconfigured. Using OFFLINE mode.");
      } else if (resApi.ok) {
          const data = await resApi.json();
          externalId = String(data.id);
          pdfUrl = data.permalink;
          console.log("✅ Invoice Issued:", externalId);
      } else {
          const errText = await resApi.text();
          console.error("❌ Facturalusa API Refused:", errText);
      }
  } catch (e) {
      console.error("⚠️ Facturalusa Network/Config Error:", e);
  }

  // 5. Update Database
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

  // 6. Complete Appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      isPaid: true,
      paidAt: new Date(),
      paymentMethod: paymentMethod
    }
  });

  // 7. CHECK REFERRAL REWARD (If First Paid Appointment)
  const userStats = await db.appointment.count({
    where: { 
        userId: invoice.userId!,
        isPaid: true
    }
  });

  // If this is the FIRST paid appointment (count === 1)
  if (userStats === 1) {
    const user = await db.user.findUnique({ 
        where: { id: invoice.userId! },
        select: { referredById: true } 
    });

    if (user && user.referredById) {
        console.log(`[Referral] First Payment! Rewarding Referrer ${user.referredById}...`);
        await db.user.update({
            where: { id: user.referredById },
            data: { loyaltyPoints: { increment: 5 } } // Reward: 5 Points
        });
    }
  }

  revalidatePath("/admin/appointments");
}


// --- HELPER --
async function resolveFacturalusaClient(draftNif: string, userId: string | null, snapshot: any) {
    const GENERIC_ID = 114354; // Consumidor Final
    let nif = draftNif;

    console.log(`[ResolveClient] Starting. DraftNIF: '${draftNif}', UserID: ${userId}`);

    // PRE-CHECK: Fetch Fresh User NIF (Fix Stale Drafts)
    let user = null;
    if (userId) {
        user = await db.user.findUnique({ where: { id: userId } });
        if (user && user.nif) {
            console.log(`[ResolveClient] Found Fresh User NIF: ${user.nif} (Overriding Draft: ${draftNif})`);
            nif = user.nif;
        }
    }

    // CASE A: No NIF or Generic
    if (!nif || nif.replace(/\s/g, "") === "999999990") {
        console.log("[ResolveClient] NIF is Generic (999999990). Using Consumidor Final.");
        return GENERIC_ID;
    }

    const token = process.env.FACTURALUSA_API_TOKEN;
    if (!token) {
        console.error("[ResolveClient] Missing Token!");
        return GENERIC_ID;
    }

    const cleanNif = nif.replace(/\s/g, "");

    // CASE B: Specific NIF
    
    // Step 1: Check Local DB Cache
    if (user) {
        // @ts-ignore
        console.log(`[ResolveClient] Local User Found:`, user ? `Yes (Has FID: ${user.facturalusaId})` : "No");
        
        // Check if cached ID is valid for CURRENT NIF
        const userNifClean = user.nif?.replace(/\s/g, "");

        // @ts-ignore
        if (user.facturalusaId && userNifClean === cleanNif) {
            // @ts-ignore
            console.log("[ResolveClient] Using Cached Local ID:", user.facturalusaId);
            // @ts-ignore
            return Number(user.facturalusaId);
        }
    }

    // Step 2: Search API (FIXED: Uses POST /customers/find)
    try {
        console.log(`[ResolveClient] Searching Facturalusa for NIF ${cleanNif}...`);
        
        const searchRes = await fetch(`https://facturalusa.pt/api/v2/customers/find`, {
             method: "POST",
             headers: { 
                 "Authorization": `Bearer ${token}`, 
                 "Accept": "application/json",
                 "Content-Type": "application/json"
            },
            body: JSON.stringify({
                value: cleanNif,
                search_in: "Vat Number"
            })
        });
        
        console.log(`[ResolveClient] Search Status: ${searchRes.status}`);

        if (searchRes.ok) {
            const result = await searchRes.json();
            // API returns the object directly if found
            if (result && result.id) {
                console.log("[ResolveClient] Found Client in API:", result.id);
                if (userId) {
                    await db.user.update({ 
                        where: { id: userId }, 
                        // @ts-ignore
                        data: { facturalusaId: String(result.id) }
                    });
                }
                return result.id;
            }
        }
        // If not found, proceed to Step 3 (Create)
    } catch (e) {
        console.error("Facturalusa Search Error:", e);
    }

    // Step 3: Create Client
    try {
        console.log("Creating New Client in Facturalusa...");
        // ENDPOINT CHANGED: /clients -> /customers
        const createRes = await fetch(`https://facturalusa.pt/api/v2/customers`, {
             method: "POST",
             headers: { 
                 "Authorization": `Bearer ${token}`, 
                 "Accept": "application/json",
                 "Content-Type": "application/json"
             },
             body: JSON.stringify({
                 code: cleanNif,
                 name: snapshot.name || "Cliente sem nome",
                 vat_number: cleanNif,
                 type: "Particular"
             })
        });

        if (createRes.ok) {
            const newClient = await createRes.json();
            console.log("Created Client:", newClient.id);
            if (userId) {
                await db.user.update({ 
                    where: { id: userId }, 
                    // @ts-ignore
                    data: { facturalusaId: String(newClient.id) }
                });
            }
            return newClient.id;
        } else {
             const err = await createRes.text();
             console.error("Create Client Failed:", err);
        }
    } catch(e) { 
        console.error("Create Client Error:", e); 
    }

    // Fallback if creation fails (to allow invoice issuance anyway?)
    // Using Generic ID might be safer than crashing
    return GENERIC_ID;
}