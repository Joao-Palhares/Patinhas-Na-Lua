"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

// CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function submitReview(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId") as string;
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment") as string;
  const imageBase64 = formData.get("imageBase64") as string | null;
  const file = formData.get("image") as File | null;

  // 1. VALIDATION
  // ... (keep validation logic) ...
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true }
  });

  if (!appointment) throw new Error("Appointment not found");
  if (appointment.userId !== user.id) throw new Error("Unauthorized");
  if (appointment.status !== "COMPLETED") throw new Error("Service not completed yet");
  if (appointment.review) throw new Error("Already reviewed");

  let photoUrl: string | null = null;

  // 2. IMAGE HANDLING
  // Strategy: Store Base64 directly in DB (Neon/Postgres allows large text)
  // This avoids external dependencies like Cloudinary that are error-prone.
  try {
      if (imageBase64 && imageBase64.startsWith("data:image")) {
          // Use the base64 string directly as the "url"
          photoUrl = imageBase64;
      } 
  } catch (error) {
    console.error("Image Processing Error:", error);
    // Continue without image if fails
  }

  // 3. SAVE REVIEW
  await db.review.create({
    data: {
      appointmentId,
      rating,
      comment,
      isPublic: false, // Moderated by default
      photos: photoUrl ? [photoUrl] : []
    }
  });

  revalidatePath("/dashboard/history");
}
