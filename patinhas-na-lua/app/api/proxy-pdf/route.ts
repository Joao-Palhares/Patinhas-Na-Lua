
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing 'url' parameter", { status: 400 });
  }

  // Security: Only allow Facturalusa URLs
  try {
    const urlObj = new URL(targetUrl);
    if (!urlObj.hostname.includes("facturalusa.pt")) {
      return new NextResponse("Invalid URL domain", { status: 403 });
    }
  } catch (e) {
    return new NextResponse("Invalid URL format", { status: 400 });
  }

  try {
    // Fetch the PDF from the external source
    const response = await fetch(targetUrl);

    if (!response.ok) {
        return new NextResponse(`Failed to fetch PDF: ${response.statusText}`, { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    // We don't forcefully set attachment here so we can view/print it in browser if needed. 
    // The download button will handle the 'download' attribute or blob saving.

    return new NextResponse(blob, { status: 200, headers });

  } catch (error) {
    console.error("PDF Proxy Error:", error);
    return new NextResponse("Internal Server Error fetching PDF", { status: 500 });
  }
}
