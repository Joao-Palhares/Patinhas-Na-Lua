"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveReview(id: string) {
  await requireAdmin();
  await db.review.update({
    where: { id },
    data: { isPublic: true }
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  // We should also delete the image from Cloudinary if we want to be clean, 
  // but for now let's just delete the record DB side.
  await db.review.delete({
    where: { id }
  });
  revalidatePath("/admin/reviews");
}
