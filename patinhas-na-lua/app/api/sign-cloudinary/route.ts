import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  console.log("--- SIGNING DEBUG ---");
  console.log("Secret Available:", !!secret);
  console.log("Cloud Name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  if (!secret) {
      console.error("❌ CRITICAL: CLOUDINARY_API_SECRET is missing in server environment!");
      return NextResponse.json({ error: "Server missing API Secret" }, { status: 500 });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // We are enforcing the folder 'patinhas-reviews'
  const paramsToSign = {
    timestamp: timestamp,
    folder: 'patinhas-reviews',
  };

  try {
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        secret
    );
    console.log("✅ Signature generated:", signature.substring(0, 5) + "...");
    return NextResponse.json({ timestamp, signature });
  } catch (err: any) {
    console.error("Signing failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
