"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ServiceCategory, PetSize, CoatType } from "@prisma/client";
import { logAudit } from "@/lib/audit";

import { requireAdmin } from "@/lib/auth";

// --- CREATE ---
// --- CREATE ---
export async function createService(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as ServiceCategory;
  const isMobileAvailable = formData.get("isMobileAvailable") === "on";

  // Check for Soft-Deleted Service
  const existingDeleted = await db.service.findFirst({
      where: { 
          name: { equals: name, mode: "insensitive" }, // Case-insensitive check
          deletedAt: { not: null }
      }
  });

  if (existingDeleted) {
      // RESTORE
      await db.service.update({
          where: { id: existingDeleted.id },
          data: {
              description,
              category,
              isMobileAvailable,
              isActive: true, // Re-activate
              deletedAt: null // Restore
          } as any
      });
      await logAudit("UPDATE", "Service", existingDeleted.id, `Restored Service: ${name}`);

  } else {
      // CREATE
      // FIX: Removed 'price' and 'durationMin' because they don't exist on Service anymore
      const service = await db.service.create({
        data: {
          name,
          description,
          category,
          isMobileAvailable,
          isTimeBased: formData.get("isTimeBased") === "on",
        } as any,
      });
      await logAudit("CREATE", "Service", service.id, `Created service: ${name}`);
  }

  revalidatePath("/admin/services");
}

// ... (Rest of the file stays the same: addPriceOption, updateService, etc.)
export async function addPriceOption(formData: FormData) {
  await requireAdmin();
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
    },
  });
  
  await logAudit("UPDATE", "Service", serviceId, "Added Price Option");
  revalidatePath("/admin/services");
}

export async function updateService(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as ServiceCategory;
  const isMobileAvailable = formData.get("isMobileAvailable") === "on";

  await db.service.update({
    where: { id },
    // Cast to any to bypass outdated local Prisma types
    data: {
      name,
      description,
      category,
      isMobileAvailable,
      isTimeBased: formData.get("isTimeBased") === "on",
    } as any,
  });

  await logAudit("UPDATE", "Service", id, `Updated service details: ${name}`);
  revalidatePath("/admin/services");
}

export async function updateServiceOption(formData: FormData) {
  await requireAdmin();
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
    },
  });
  
  // Find service ID for logging?
  await logAudit("UPDATE", "ServiceOption", id, "Updated Price Option");
  revalidatePath("/admin/services");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  
  // Soft Delete
  await db.service.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false } as any,
  });
  
  await logAudit("DELETE", "Service", id, "Soft deleted service");
  revalidatePath("/admin/services");
}

export async function deleteOption(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.serviceOption.delete({ where: { id } });
  await logAudit("DELETE", "ServiceOption", id, "Deleted Price Option");
  revalidatePath("/admin/services");
}
