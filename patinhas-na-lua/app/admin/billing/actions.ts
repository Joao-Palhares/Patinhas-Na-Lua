"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

import { requireAdmin, checkAdminRateLimit } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/email";

// Helper to enforce Lisbon Timezone for API
function getLisbonDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });
}

// Helper to get Facturalusa config at runtime (not build time!)
function getFacturalusaConfig() {
  const seriesId = process.env.FACTURALUSA_SERIES_ID ? Number(process.env.FACTURALUSA_SERIES_ID) : null;
  const genericClientId = process.env.FACTURALUSA_GENERIC_CLIENT_ID ? Number(process.env.FACTURALUSA_GENERIC_CLIENT_ID) : 114354;
  const genericServiceId = process.env.FACTURALUSA_GENERIC_SERVICE_ID ? Number(process.env.FACTURALUSA_GENERIC_SERVICE_ID) : null;
  const apiToken = process.env.FACTURALUSA_API_TOKEN;
  
  return { seriesId, genericClientId, genericServiceId, apiToken };
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
  
  // Rate limit invoice issuing (max 20 per 10 min)
  const rateLimitError = await checkAdminRateLimit('issueInvoice', 20);
  if (rateLimitError) {
    return { success: false, error: rateLimitError };
  }
  
  // 1. Get Config at RUNTIME (not build time)
  const config = getFacturalusaConfig();
  
  // Detailed validation with specific error messages
  const missingVars = [];
  if (!config.seriesId) missingVars.push("FACTURALUSA_SERIES_ID");
  if (!config.genericClientId) missingVars.push("FACTURALUSA_GENERIC_CLIENT_ID");
  if (!config.genericServiceId) missingVars.push("FACTURALUSA_GENERIC_SERVICE_ID");
  if (!config.apiToken) missingVars.push("FACTURALUSA_API_TOKEN");
  
  if (missingVars.length > 0) {
    return { 
      success: false, 
      error: `Configuração Facturalusa em falta: ${missingVars.join(", ")}. Verifique as variáveis de ambiente no Vercel.` 
    };
  }

  // 2. Get Billing Data
  const invoice = await db.invoice.findUnique({ 
    where: { appointmentId },
    include: { appointment: { include: { service: true, extraFees: { include: { extraFee: true } } } } }
  });

  if (!invoice || !invoice.appointment) return { success: false, error: "Rascunho de fatura não encontrado" };

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
      },
      config
  );

  const finalClientId = resolvedClientId || config.genericClientId;

  // 4. Map Items (All to GENERIC_SERVICE_ID, but with custom description)
  const items = [];
  const extras = invoice.appointment.extraFees || [];
  const extrasSum = extras.reduce((acc, curr) => acc + Number(curr.appliedPrice), 0);
  const baseServicePrice = Number(invoice.subtotal) - extrasSum;

  // Item 1: Main Service
  items.push({
      id: config.genericServiceId, 
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
          id: config.genericServiceId,
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
    serie: config.seriesId, 
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


  
  let externalId = "OFFLINE-" + Date.now().toString().slice(-6); // Fallback ID
  let pdfUrl = null;

  try {
      const resApi = await fetch("https://facturalusa.pt/api/v2/sales", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${config.apiToken}`,
              "User-Agent": "PatinhasApp/1.0"
          },
          body: JSON.stringify(payload)
      });

      if (resApi.ok) {
          const data = await resApi.json();
          externalId = String(data.id);
          pdfUrl = data.url_file;
          
          // Send custom email (Fire and Forget)
          // @ts-ignore
          if (invoice.invoicedEmail && pdfUrl) {
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
          return { success: false, error: `Erro Facturalusa: ${errText}` };
      }
  } catch (e) {
      return { success: false, error: "Erro ao comunicar com Facturalusa" }; 
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
        await db.user.update({
            where: { id: user.referredById },
            data: { loyaltyPoints: { increment: 5 } }
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
async function resolveFacturalusaClient(
    draftNif: string, 
    userId: string | null, 
    snapshot: any,
    config: { genericClientId: number; apiToken: string | undefined }
) {
    const GENERIC_ID = config.genericClientId; 

    let nif = draftNif;

    // PRE-CHECK: Fetch Fresh User NIF (Fix Stale Drafts)
    let user = null;
    if (userId) {
        user = await db.user.findUnique({ where: { id: userId } });
        if (user && user.nif) {
            nif = user.nif;
        }
    }

    // CASE A: No NIF or Generic
    if (!nif || nif.replace(/\s/g, "") === "999999990") {
        return GENERIC_ID;
    }

    if (!config.apiToken) {
        return GENERIC_ID;
    }

    const cleanNif = nif.replace(/\s/g, "");

    // CASE B: Specific NIF
    
    // Step 1: Check Local DB Cache
    if (user) {
        const userNifClean = user.nif?.replace(/\s/g, ""); 

        // @ts-ignore
        if (user.facturalusaId && userNifClean === cleanNif) {
            // @ts-ignore
            return Number(user.facturalusaId);
        }
    }

    // Step 2: Search API
    try {
        const searchRes = await fetch(`https://facturalusa.pt/api/v2/customers/find`, {
             method: "POST",
             headers: { 
                 "Authorization": `Bearer ${config.apiToken}`, 
                 "Accept": "application/json",
                 "Content-Type": "application/json"
            },
            body: JSON.stringify({
                value: cleanNif,
                search_in: "Vat Number"
            })
        });

        if (searchRes.ok) {
            const result = await searchRes.json();
            if (result && result.id) {
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
    } catch (e) {
        // Silently fail to Step 3
    }

    // Step 3: Create Client
    try {
        const createRes = await fetch(`https://facturalusa.pt/api/v2/customers`, {
             method: "POST",
             headers: { 
                 "Authorization": `Bearer ${config.apiToken}`, 
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
            if (userId) {
                await db.user.update({ 
                    where: { id: userId }, 
                    // @ts-ignore
                    data: { facturalusaId: String(newClient.id) }
                });
            }
            return newClient.id;
        }
    } catch(e) { 
        // Fallback to generic
    }

    return GENERIC_ID;
}
