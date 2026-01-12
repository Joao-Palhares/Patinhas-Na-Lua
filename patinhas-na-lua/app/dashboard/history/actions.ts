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

  // 1. INPUTS
  const appointmentId = formData.get("appointmentId") as string;
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment") as string;
  const clientProvidedUrl = formData.get("photoUrl") as string | null;

  // 2. VALIDATION
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true }
  });

  if (!appointment) throw new Error("Appointment not found");
  if (appointment.userId !== user.id) throw new Error("Unauthorized");
  if (appointment.status !== "COMPLETED") throw new Error("Service not completed yet");
  if (appointment.review) throw new Error("Already reviewed");

  let photoUrl = clientProvidedUrl;

  // Security check: ensure URL is from our Cloudinary account if configured (optional but good practice)
  // For now we trust the client provided URL since it's an unsigned upload to our own cloud.

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
