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
  const nif = formData.get("nif") as string;
  const referralInput = formData.get("referralCode") as string;

  if (!name || !phone) return { error: "Nome e Telemóvel são obrigatórios." };

  // Generate dummy email if missing
  if (!email) {
     const safePhone = phone.replace(/\D/g, ""); 
     email = `${safePhone}_offline@patinhas.pt`; 
  }

  try {
     const { randomUUID } = await import('crypto');
     const id = `offline_${randomUUID()}`;

     // Handl Referral
     let referredById = null;
     if (referralInput) {
        const referrer = await db.user.findUnique({
             where: { referralCode: referralInput.toUpperCase(), isBlacklisted: false }
        });
        if (referrer) referredById = referrer.id;
     }

     // Generate a Referral Code for this new user
     // MATCHING ONBOARDING LOGIC
     // Logic: First 3 letters of name + 4 random digits. Check uniqueness loop.
     let newReferralCode = "";
     let isUnique = false;
     const namePrefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PAT";

     // Safety loop (max 5 tries) to find a unique code
     for (let i = 0; i < 5; i++) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        const candidateCode = `${namePrefix}${randomSuffix}`;
        const existing = await db.user.findUnique({ where: { referralCode: candidateCode } });
        if (!existing) {
            newReferralCode = candidateCode;
            isUnique = true;
            break;
        }
     }

     if (!isUnique) {
        newReferralCode = `PAT${Date.now().toString().slice(-6)}`;
     }

     console.log(`[CreateClient] Generated Referral Code: ${newReferralCode}`);


     await db.user.create({
       data: {
         id,
         name,
         phone,
         email,
         nif: nif || null,
         notes,
         referralCode: newReferralCode,
         referredById,
         isOfflineUser: true
       }
     });

     revalidatePath("/admin/clients");
     return { success: true };
  } catch (error) {
    console.error("Failed to create offline client:", error);
    // Helper to detect unique constraint violations
    // @ts-ignore
    if (error.code === 'P2002') return { error: "Erro: Email, Telefone ou NIF já registados." };
    return { error: "Erro ao criar cliente." };
  }
}

export async function updateClientAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string; // Expecting full format
  const email = formData.get("email") as string;
  const nif = formData.get("nif") as string;
  const notes = formData.get("notes") as string;

  if (!id) return { error: "ID de cliente em falta." };

  try {
     await db.user.update({
       where: { id },
       data: {
         name,
         phone,
         email: email || undefined,
         nif: nif || null,
         notes,
         referralCode: formData.get("referralCode") as string || undefined
       }
     });

     revalidatePath(`/admin/clients/${id}`);
     revalidatePath("/admin/clients");
     return { success: true };
  } catch (error) {
    console.error("Failed to update client:", error);
    // @ts-ignore
    if (error.code === 'P2002') {
        // @ts-ignore
        const target = error.meta?.target;
        if (Array.isArray(target)) {
            if (target.includes('referralCode')) return { error: "Erro: Este Código de Referência já está a ser utilizado." };
            if (target.includes('email')) return { error: "Erro: Este Email já está registado." };
            if (target.includes('phone')) return { error: "Erro: Este Telemóvel já está registado." };
            if (target.includes('nif')) return { error: "Erro: Este NIF já está registado." };
        }
        return { error: "Erro: Dados duplicados (Email, Telefone, NIF ou Código)." };
    }
    return { error: "Erro ao atualizar cliente." };
  }
}