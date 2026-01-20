"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/email";

// --- CONFIGURATION & ENV VARIABLES ---
const FACTURALUSA_SERIES_ID = process.env.FACTURALUSA_SERIES_ID ? Number(process.env.FACTURALUSA_SERIES_ID) : null;
const FACTURALUSA_GENERIC_CLIENT_ID = process.env.FACTURALUSA_GENERIC_CLIENT_ID ? Number(process.env.FACTURALUSA_GENERIC_CLIENT_ID) : 114354;
const FACTURALUSA_GENERIC_SERVICE_ID = process.env.FACTURALUSA_GENERIC_SERVICE_ID ? Number(process.env.FACTURALUSA_GENERIC_SERVICE_ID) : null;
const FACTURALUSA_API_TOKEN = process.env.FACTURALUSA_API_TOKEN;

// Validation (Log Warning/Error mainly for dev awareness, but allow app to start)
if (!process.env.FACTURALUSA_GENERIC_CLIENT_ID) {
    console.warn("⚠️ WARNING: FACTURALUSA_GENERIC_CLIENT_ID is missing in .env. Using fallback ID 114354.");
}

// Helper to enforce Lisbon Timezone for API
function getLisbonDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });
}

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
  
  // 1. Env Validation & Config
  if (!FACTURALUSA_SERIES_ID || !FACTURALUSA_GENERIC_CLIENT_ID || !FACTURALUSA_GENERIC_SERVICE_ID || !FACTURALUSA_API_TOKEN) {
      throw new Error("Missing Facturalusa Env Variables (CHECK: SERIES_ID, GENERIC_CLIENT_ID, GENERIC_SERVICE_ID, API_TOKEN)");
  }

  // 2. Get Billing Data
  const invoice = await db.invoice.findUnique({ 
    where: { appointmentId },
    include: { appointment: { include: { service: true, extraFees: { include: { extraFee: true } } } } }
  });

  if (!invoice || !invoice.appointment) throw new Error("Invoice Draft not found");

  // 3. Resolve Client ID
  // @ts-ignore
  const clientNif = invoice.invoicedNif;
  const resolvedClientId = await resolveFacturalusaClient(
      clientNif, 
      invoice.userId, 
      {
          name: invoice.invoicedName,
          email: invoice.invoicedEmail,
          address: invoice.invoicedAddress
      }
  );

  const finalClientId = resolvedClientId || FACTURALUSA_GENERIC_CLIENT_ID;

  // 4. Map Items (All to GENERIC_SERVICE_ID, but with custom description)
  const items = [];
  const extras = invoice.appointment.extraFees || [];
  const extrasSum = extras.reduce((acc, curr) => acc + Number(curr.appliedPrice), 0);
  const baseServicePrice = Number(invoice.subtotal) - extrasSum;

  // Item 1: Main Service
  items.push({
      id: FACTURALUSA_GENERIC_SERVICE_ID, 
      description: invoice.appointment.service.name,
      details: invoice.appointment.service.name, // Ensure visible on PDF
      quantity: 1,
      price: baseServicePrice, 
      vat: "0",         
      vat_exemption: "M10" 
  });

  // Items 2..N: Extra Fees
  extras.forEach(fee => {
      items.push({
          id: FACTURALUSA_GENERIC_SERVICE_ID,
          description: fee.extraFee.name,
          details: fee.extraFee.name, // Ensure visible on PDF
          quantity: 1,
          price: Number(fee.appliedPrice),
          vat: "0",
          vat_exemption: "M10"
      });
  });

  // 5. Construct Payload
  const payload = {
    document_type: "Factura Recibo",
    serie: FACTURALUSA_SERIES_ID, 
    vat_type: "IVA incluído",
    issue_date: getLisbonDate(), // Production Date Logic
    
    // Auth
    customer: finalClientId, 
    vat_number: clientNif || "999999990", 
    
    items: items, 
    status: "Terminado",
    force_print: true,     // Generate PDF
    force_send_email: false // DISABLE external email (we send our own)
  };

  console.log("Issuing Invoice Payload:", JSON.stringify(payload));
  
  let externalId = "OFFLINE-" + Date.now().toString().slice(-6); // Fallback ID
  let pdfUrl = null;

  try {
      const resApi = await fetch("https://facturalusa.pt/api/v2/sales", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${FACTURALUSA_API_TOKEN}`,
              "User-Agent": "PatinhasApp/1.0"
          },
          body: JSON.stringify(payload)
      });

      if (resApi.ok) {
          const data = await resApi.json();
          externalId = String(data.id);
          pdfUrl = data.url_file; // Fix: API returns 'url_file', not 'permalink'
          console.log("✅ Invoice Issued:", externalId, "PDF:", pdfUrl);
          
          // --- CUSTOM EMAIL LOGIC (Fire and Forget) ---
          // @ts-ignore
          if (invoice.invoicedEmail && pdfUrl) {
              console.log("📧 Triggering Invoice Email...");
              sendInvoiceEmail({
                  // @ts-ignore
                  to: invoice.invoicedEmail,
                  userName: invoice.invoicedName || "Cliente",
                  invoiceNumber: externalId,
                  pdfUrl: pdfUrl,
                  totalAmount: String(invoice.totalAmount)
              });
          }

      } else {
          const errText = await resApi.text();
          console.error("❌ Facturalusa API Refused:", errText);
          throw new Error(`Facturalusa Error: ${errText}`);
      }
  } catch (e) {
      console.error("⚠️ Facturalusa Execution Error:", e);
      // CRITICAL FIX: Stop execution here. Do not let it proceed to DB updates.
      throw e; 
  }

  // 6. Update Database
  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "ISSUED",
      invoiceNumber: externalId,
      externalId: externalId,
      pdfUrl: pdfUrl, // Save the permalink
      date: new Date(),
    }
  });

  // 7. Complete Appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      isPaid: true,
      paidAt: new Date(),
      paymentMethod: paymentMethod
    }
  });

  // 8. CHECK REFERRAL REWARD (If First Paid Appointment)
  const userStats = await db.appointment.count({
    where: { 
        userId: invoice.userId!,
        isPaid: true
    }
  });

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

  return {
    success: true,
    invoiceId: externalId,
    pdfUrl: pdfUrl
  };
}


// --- HELPER --
async function resolveFacturalusaClient(draftNif: string, userId: string | null, snapshot: any) {
    // Uses Global Constant with Fallback
    const GENERIC_ID = FACTURALUSA_GENERIC_CLIENT_ID; 

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

    if (!FACTURALUSA_API_TOKEN) {
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
                 "Authorization": `Bearer ${FACTURALUSA_API_TOKEN}`, 
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
                 "Authorization": `Bearer ${FACTURALUSA_API_TOKEN}`, 
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