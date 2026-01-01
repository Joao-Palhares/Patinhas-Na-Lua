"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ServiceCategory, PetSize, CoatType } from "@prisma/client";

// --- CREATE ---
export async function createService(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as ServiceCategory;
  const isMobileAvailable = formData.get("isMobileAvailable") === "on";

  // FIX: Removed 'price' and 'durationMin' because they don't exist on Service anymore
  await db.service.create({
    data: {
      name,
      description,
      category,
      isMobileAvailable
    } as any
  });
  revalidatePath("/admin/services");
}

// ... (Rest of the file stays the same: addPriceOption, updateService, etc.)
export async function addPriceOption(formData: FormData) {
  const serviceId = formData.get("serviceId") as string;
  const size = formData.get("size") as PetSize | "ALL";
  const coat = formData.get("coat") as CoatType | "ALL";
  const price = Number(formData.get("price"));
  const durationMin = Number(formData.get("durationMin"));
  const durationMax = Number(formData.get("durationMax"));

  await db.serviceOption.create({
    data: {
      serviceId,
      petSize: size === "ALL" ? null : size,
      coatType: coat === "ALL" ? null : coat,
      price,
      durationMin,
      durationMax: durationMax || null,
    }
  });
  revalidatePath("/admin/services");
}

export async function updateService(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as ServiceCategory;
  const isMobileAvailable = formData.get("isMobileAvailable") === "on";

  await db.service.update({
    where: { id },
    // Cast to any to bypass outdated local Prisma types
    data: { name, description, category, isMobileAvailable } as any
  });
  revalidatePath("/admin/services");
}

export async function updateServiceOption(formData: FormData) {
  const id = formData.get("id") as string;
  const size = formData.get("size") as PetSize | "ALL";
  const coat = formData.get("coat") as CoatType | "ALL";
  const price = Number(formData.get("price"));
  const durationMin = Number(formData.get("durationMin"));
  const durationMax = Number(formData.get("durationMax"));

  await db.serviceOption.update({
    where: { id },
    data: {
      petSize: size === "ALL" ? null : size,
      coatType: coat === "ALL" ? null : coat,
      price,
      durationMin,
      durationMax: durationMax || null,
    }
  });
  revalidatePath("/admin/services");
}

export async function deleteService(formData: FormData) {
  const id = formData.get("id") as string;
  await db.service.delete({ where: { id } });
  revalidatePath("/admin/services");
}

export async function deleteOption(formData: FormData) {
  const id = formData.get("id") as string;
  await db.serviceOption.delete({ where: { id } });
  revalidatePath("/admin/services");
}