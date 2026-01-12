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

  // 2. UPLOAD IMAGE
  try {
      // Priority: Base64 (from client compression)
      if (imageBase64 && imageBase64.startsWith("data:image")) {
          const result = await cloudinary.uploader.upload(imageBase64, {
              folder: "patinhas-reviews",
              resource_type: "image"
          });
          photoUrl = result.secure_url;
      } 
      // Fallback: File Object (Upload Stream)
      else if (file && file.size > 0 && file.name !== "undefined") {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
            { 
                folder: "patinhas-reviews",
                resource_type: "image"
            }, 
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
            ).end(buffer);
        });
        photoUrl = uploadResult.secure_url;
      }
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    // Don't block review if image fails, just log it? Or throw? 
    // User expects image, so let's throw.
    throw new Error("Failed to upload image");
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
