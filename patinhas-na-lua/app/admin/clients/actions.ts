"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Species, PetSize, CoatType } from "@prisma/client";
import { logAudit } from "@/lib/audit";

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

  // Check for Soft Deleted Pet
  const existingDeletedPet = await db.pet.findFirst({
    where: { 
        userId, 
        name: { equals: name, mode: "insensitive" }, // Case insensitive match maybe?
        deletedAt: { not: null } 
    }
  });

  if (existingDeletedPet) {
     // RESTORE
     await db.pet.update({
         where: { id: existingDeletedPet.id },
         data: {
             species,
             breed,
             gender,
             sizeCategory: sizeCategory || null,
             coatType: coatType || null,
             microchip,
             medicalNotes,
             birthDate: birthDateString ? new Date(birthDateString) : null,
             deletedAt: null // RESTORE
         }
     });
     await logAudit("UPDATE", "Pet", existingDeletedPet.id, `Restored Pet ${name}`);

  } else {
      // CREATE
      const pet = await db.pet.create({
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
      await logAudit("CREATE", "Pet", pet.id, `Created Pet ${name} for User ${userId}`);
  }

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

    await logAudit("UPDATE", "Pet", id, `Updated Pet Profile`);

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
    // Soft Delete
    await db.pet.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    await logAudit("DELETE", "Pet", id, "Soft deleted pet");
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

  // --- LOGIC SPLIT: ONLINE INVITE vs OFFLINE CLIENT ---
  const isInvite = !!email && email.trim() !== "";
  
  // If Offline, generate dummy email
  if (!isInvite) {
     const safePhone = phone.replace(/\D/g, ""); 
     email = `${safePhone}_offline@patinhas.pt`; 
  }

  try {
     const { randomUUID } = await import('crypto');

     // 1. CHECK FOR SOFT DELETED USER
     const existingDeletedUser = await db.user.findFirst({
        where: { email: email, deletedAt: { not: null } }
     });

     let userId = "";

     if (existingDeletedUser) {
        // --- RESTORE MODE ---
        userId = existingDeletedUser.id;
        await db.user.update({
            where: { id: userId },
            data: {
                name,
                phone,
                nif: nif || null,
                notes,
                deletedAt: null, // Restore
                status: isInvite ? "INVITED" : "ACTIVE"
            }
        });
        await logAudit("UPDATE", "User", userId, "Restored soft-deleted user via Create Action");

     } else {
        // --- CREATE MODE ---
        let id: string;
        if (!isInvite) {
           id = `offline_${randomUUID()}`;
        } else {
           id = randomUUID(); // Explicit ID for Invite too
        }
        userId = id;

        // Handle Referral
        let referredById = null;
        if (referralInput) {
            const referrer = await db.user.findUnique({
                 where: { referralCode: referralInput.toUpperCase(), isBlacklisted: false }
            });
            if (referrer) referredById = referrer.id;
        }

        // Generate a Referral Code for this new user
        let newReferralCode = "";
        let isUnique = false;
        const namePrefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PAT";

        // Safety loop
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

        const user = await db.user.create({
          data: {
            id: id,
            name,
            phone,
            email,
            nif: nif || null,
            notes,
            referralCode: newReferralCode,
            referredById,
            isOfflineUser: !isInvite,
            // @ts-ignore
            status: isInvite ? "INVITED" : "ACTIVE" 
          }
        });
        
        await logAudit("CREATE", "User", user.id, `Created ${isInvite ? 'Invited' : 'Offline'} Client: ${name}`);
     }

     // --- SEND CLERK INVITE (Refactored to check userId) ---
     if (isInvite) {
         try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
                ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` 
                : "http://localhost:3000/dashboard";

            const client = await clerkClient();
            await client.invitations.createInvitation({
                emailAddress: email,
                redirectUrl: redirectUrl,
                publicMetadata: {
                    internalUserId: userId,
                },
                ignoreExisting: true,
            });
         } catch (invErr) {
             // Invitation failed - client created but not invited
         }
     }

     revalidatePath("/admin/clients");
     return { success: true };
  } catch (error) {
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

     await logAudit("UPDATE", "User", id, `Updated Client Profile`);

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