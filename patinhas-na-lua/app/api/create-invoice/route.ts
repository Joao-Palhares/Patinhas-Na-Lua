import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get("authorization");
    const token = process.env.FACTURALUSA_API_TOKEN;

    // Strict check: Must match the env token (Basic Protection)
    if (!token || authHeader !== `Bearer ${token}`) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Input Parsing
    const body = await req.json();
    const { 
        clientName = "Consumidor Final", 
        clientNif = "999999990", 
        clientEmail, 
        serviceDescription, 
        totalPrice, 
        userId 
    } = body;
    
    // Validate required fields
    if (!totalPrice || !serviceDescription) {
        return NextResponse.json({ error: "Missing required fields: totalPrice, serviceDescription" }, { status: 400 });
    }

    // 3. Calculation (VAT EXEMPT - ART 53)
    const vatRate = 0; 
    const finalPrice = Number(totalPrice);
    const basePrice = finalPrice; // No tax extraction
    const taxAmount = 0;

    // 4. External Request (Facturalusa)
    const payload = {
        document_type: "Factura Recibo",
        // serie: REMOVED (Let API use default)
        vat_type: "IVA incluído",
        issue_date: new Date().toISOString().split('T')[0],
        client: {
            name: clientName,
            vat: clientNif,
            email: clientEmail,
            address: "Rua", // Default if missing
            city: "Cidade",
            postal_code: "0000-000",
            country: "PT"
        },
        items: [
            {
                reference: "SRV",
                description: serviceDescription,
                qty: 1,
                unit_price: basePrice, 
                vat: "0",         // Rate is 0
                vat_exemption: "M10" // Exemption code Art 53
            }
        ],
        status: "Terminado"
    };

    console.log("Sending to Facturalusa:", JSON.stringify(payload));
    
    // ------------- CRITICAL SECTION: API URL -------------
    const resApi = await fetch("https://facturalusa.pt/api/v2/sales", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json", // MANDATORY
            "Authorization": `Bearer ${token}` // Using same token for external API as requested
        },
        body: JSON.stringify(payload)
    });

    if (!resApi.ok) {
        const errText = await resApi.text();
        console.error("Facturalusa API Error:", errText);
        return NextResponse.json({ error: "Facturalusa Provider Error", details: errText }, { status: 502 });
    }

    const data = await resApi.json();
    // Expected Layout: { id: "123", permalink: "..." } - Inspect response if needed
    
    // 5. Save to Local DB
    const invoice = await db.invoice.create({
        data: {
             // @ts-ignore
             invoicedName: clientName,
             invoicedNif: clientNif,
             invoicedEmail: clientEmail,
             
             subtotal: basePrice,
             taxAmount: taxAmount,
             totalAmount: finalPrice,
             
             status: "DRAFT", 
             externalId: String(data.id), // Ensure string
             pdfUrl: data.permalink || null, // Capture download link
             
             // Optional Relation
             userId: userId || undefined
        }
    });

    return NextResponse.json({ 
        success: true, 
        localId: invoice.id,
        externalId: invoice.externalId,
        pdfUrl: invoice.pdfUrl 
    });

  } catch (e: any) {
      console.error("Invoice Creation Route Error:", e);
      return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
