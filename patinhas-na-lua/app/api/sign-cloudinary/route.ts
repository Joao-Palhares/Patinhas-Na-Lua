import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  // Require authentication to prevent abuse
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Get folder from request body (or use default)
  let folder = 'patinhas-uploads';
  try {
    const body = await req.json();
    if (body.folder) {
      folder = body.folder;
    }
  } catch {
    // No body or invalid JSON, use default folder
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = {
    timestamp: timestamp,
    folder: folder,
  };

  try {
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        secret
    );
    return NextResponse.json({ timestamp, signature, folder });
  } catch (err: any) {
    return NextResponse.json({ error: "Signing failed" }, { status: 500 });
  }
}

