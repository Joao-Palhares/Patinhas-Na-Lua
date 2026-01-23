import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  // Require authentication to prevent abuse
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = {
    timestamp: timestamp,
    folder: 'patinhas-reviews',
  };

  try {
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        secret
    );
    return NextResponse.json({ timestamp, signature });
  } catch (err: any) {
    return NextResponse.json({ error: "Signing failed" }, { status: 500 });
  }
}
