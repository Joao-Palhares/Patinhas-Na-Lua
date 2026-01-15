"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Species, PetSize, CoatType } from "@prisma/client";

export async function createPetAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const species = formData.get("species") as Species;
  const breed = formData.get("breed") as string;
  const gender = formData.get("gender") as string;

  const sizeCategory = formData.get("sizeCategory") as PetSize;
  const coatType = formData.get("coatType") as CoatType;

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
      sizeCategory: sizeCategory || null,
      coatType: coatType || null,

      microchip,
      medicalNotes,
      birthDate: birthDateString ? new Date(birthDateString) : null,
    }
  });

  // Refresh both the list and the details page
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${userId}`);
  revalidatePath("/dashboard/pets");
}

export async function updatePetAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const species = formData.get("species") as Species;
  const breed = formData.get("breed") as string;
  const gender = formData.get("gender") as string;

  const sizeCategory = formData.get("sizeCategory") as PetSize;
  const coatType = formData.get("coatType") as CoatType;
  const birthDateString = formData.get("birthDate") as string;

  try {
    await db.pet.update({
      where: { id },
      data: {
        name,
        species,
        breed,
        gender,
        sizeCategory: sizeCategory || null,
        coatType: coatType || null,
        birthDate: birthDateString ? new Date(birthDateString) : null,
      }
    });

    revalidatePath("/dashboard/pets");
    return { success: true };
  } catch (error) {
    console.error("Error updating pet:", error);
    return { error: "Failed to update pet" };
  }
}

export async function deletePetAction(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    await db.pet.delete({ where: { id } });
    revalidatePath("/dashboard/pets");
  } catch (error) {
    console.error("Failed to delete pet:", error);
  }
}

export async function createOfflineClientAction(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  let email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  if (!name || !phone) return { error: "Nome e Telemóvel são obrigatórios." };

  // Generate dummy email if missing
  if (!email) {
     const safePhone = phone.replace(/\D/g, ""); 
     // Add random suffix to avoid collision if same phone used
     email = `${safePhone}_offline@patinhas.pt`; 
  }

  try {
     const { randomUUID } = await import('crypto');
     const id = `offline_${randomUUID()}`;

     await db.user.create({
       data: {
         id,
         name,
         phone,
         email,
         notes,
         // @ts-ignore: Field might not be generated yet in client types
         isOfflineUser: true
       }
     });

     revalidatePath("/admin/clients");
     return { success: true };
  } catch (error) {
    console.error("Failed to create offline client:", error);
    return { error: "Erro ao criar cliente. O Email ou Telefone já podem estar registados." };
  }
}