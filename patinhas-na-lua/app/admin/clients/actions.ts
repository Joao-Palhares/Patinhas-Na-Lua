"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Species } from "@prisma/client";

export async function createPetAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const species = formData.get("species") as Species;
  const breed = formData.get("breed") as string;
  const gender = formData.get("gender") as string;
  
  // Optional fields
  const microchip = formData.get("microchip") as string;
  const medicalNotes = formData.get("medicalNotes") as string;
  const birthDateString = formData.get("birthDate") as string;

  await db.pet.create({
    data: {
      userId,
      name,
      species,
      breed,
      gender,
      microchip,
      medicalNotes,
      birthDate: birthDateString ? new Date(birthDateString) : null,
    }
  });

  // Refresh both the list and the details page
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${userId}`);
}