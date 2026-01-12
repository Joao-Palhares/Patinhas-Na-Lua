import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // We are enforcing the folder 'patinhas-reviews'
  const paramsToSign = {
    timestamp: timestamp,
    folder: 'patinhas-reviews',
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({ timestamp, signature });
}
