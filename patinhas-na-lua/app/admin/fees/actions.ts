"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createFee(formData: FormData) {
  const name = formData.get("name") as string;
  const basePrice = Number(formData.get("price"));
  
  await db.extraFee.create({
    data: { name, basePrice }
  });
  revalidatePath("/admin/fees");
}

export async function deleteFee(formData: FormData) {
  const id = formData.get("id") as string;
  await db.extraFee.delete({ where: { id } });
  revalidatePath("/admin/fees");
}