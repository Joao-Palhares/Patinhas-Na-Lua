"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(prevState: any, formData: FormData) {
  const user = await currentUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  // SANITIZE INPUTS: Remove all whitespace/spaces from phone and NIF
  const phone = (formData.get("phone") as string)?.replace(/\s/g, "");
  const nif = (formData.get("nif") as string)?.replace(/\s/g, "");
  const address = formData.get("address") as string;
  const name = formData.get("name") as string;
  const incomingReferralCode = (formData.get("referralCode") as string)
    ?.toUpperCase()
    .trim();

  try {
    // --- SERVER SIDE VERIFICATIONS ---

    // 1. Validate Phone (Allowed International: +351..., etc. or simple 9 digits)
    // Regex: Optional +, followed by 7 to 15 digits
    const phoneRegex = /^(\+)?[0-9]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return {
        error:
          "Número de telemóvel inválido (deve ter entre 7 a 15 algarismos).",
        payload: { name, nif, address, referralCode: incomingReferralCode }
      };
    }

    // 2. Validate NIF (Must be 9 digits, only numbers)
    const nifRegex = /^[0-9]{9}$/;
    if (!nifRegex.test(nif)) {
      return { 
        error: "NIF inválido. Deve ter 9 dígitos.",
        payload: { name, nif, address, referralCode: incomingReferralCode }
      };
    }

    // 3. Validate Incoming Referral Code (If provided)
    let referredById = null;
    if (incomingReferralCode) {
      // Check if code exists
      const referrer = await db.user.findUnique({
        where: { referralCode: incomingReferralCode },
      });

      if (!referrer) {
        return {
          error: `O código de convite "${incomingReferralCode}" não existe.`,
          payload: { name, nif, address, referralCode: incomingReferralCode }
        };
      }

      // Prevent self-referral (though rare in onboarding, safer to check)
      if (referrer.id === user.id) {
        return { 
          error: "Não podes usar o teu próprio código.",
          payload: { name, nif, address, referralCode: incomingReferralCode }
        };
      }

      referredById = referrer.id;
    }

    // ---------------------------------

    // 4. Generate A UNIQUE Referral Code for THIS new user (Auto-Generate)
    // Logic: First 3 letters of name + 4 random digits. Check uniqueness loop.
    let newReferralCode = "";
    let isUnique = false;
    const namePrefix =
      name
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase() || "PAT";

    // Safety loop (max 5 tries) to find a unique code
    for (let i = 0; i < 5; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const candidateCode = `${namePrefix}${randomSuffix}`;

      const existing = await db.user.findUnique({
        where: { referralCode: candidateCode },
      });
      if (!existing) {
        newReferralCode = candidateCode;
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      // Fallback if super unlucky: use a timestamp suffix
      newReferralCode = `PAT${Date.now().toString().slice(-6)}`;
    }

    // FIX: Intelligent Account Linking for Dev/Production
    // If a user exists with this email but a DIFFERENT ID (common in Clerk Dev env), we must migrate the data.

    const existingUserByEmail = await db.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
    });

    if (existingUserByEmail && existingUserByEmail.id !== user.id) {
      console.log(
        `[Onboarding] Found existing user ${existingUserByEmail.id} with same email. Migrating data to new ID ${user.id}...`
      );

      // TRANSACTION STRATEGY:
      // 1. Create New User with a TEMP email (to reserve the ID)
      // 2. Move records
      // 3. Delete Old User
      // 4. Update New User to correct email

      await db.$transaction(async (tx) => {
        // A. Create the NEW user with the Real ID but a Temporary Email
        // This is needed so we have a target for the relations
        await tx.user.create({
          data: {
            id: user.id,
            email: `temp_${user.id}@migration.com`,
            name: name,
            phone: phone,
            nif: nif,
            address: address,
            referralCode: newReferralCode,
            // We inherit points & settings? Maybe. Let's start fresh or copy?
            // Let's COPY critical data if meaningful
            loyaltyPoints: existingUserByEmail.loyaltyPoints,
            isAdmin: existingUserByEmail.isAdmin, // Preserve Admin status!
            createdAt: existingUserByEmail.createdAt,
          },
        });

        // B. Migrate all relations from Old ID -> New ID
        // Pets
        await tx.pet.updateMany({
          where: { userId: existingUserByEmail.id },
          data: { userId: user.id },
        });

        // Appointments
        await tx.appointment.updateMany({
          where: { userId: existingUserByEmail.id },
          data: { userId: user.id },
        });

        // Invoices
        await tx.invoice.updateMany({
          where: { userId: existingUserByEmail.id },
          data: { userId: user.id },
        });

        // Coupons
        await tx.coupon.updateMany({
          where: { userId: existingUserByEmail.id },
          data: { userId: user.id },
        });

        // Push Subscriptions
        await tx.pushSubscription.updateMany({
          where: { userId: existingUserByEmail.id },
          data: { userId: user.id },
        });

        // Referrals (As Referrer)
        await tx.user.updateMany({
          where: { referredById: existingUserByEmail.id },
          data: { referredById: user.id },
        });

        // C. Delete the Old User (now empty of relations)
        await tx.user.delete({
          where: { id: existingUserByEmail.id },
        });

        // D. Update the New User to the Real Email
        await tx.user.update({
          where: { id: user.id },
          data: { email: user.emailAddresses[0].emailAddress },
        });
      });
    } else {
      // Normal Flow: Create or Update (if ID matches)
      await db.user.upsert({
        where: { email: user.emailAddresses[0].emailAddress },
        update: {
          name: name,
          phone: phone,
          nif: nif,
          address: address,
          id: user.id,
        },
        create: {
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: name,
          phone: phone,
          nif: nif,
          address: address,
          referralCode: newReferralCode,
          referredById: referredById,
        },
      });
    }
  } catch (error) {
    console.error("Onboarding error:", error);
    return { 
      error: "Ocorreu um erro ao processar o registo.",
      payload: { name, nif, address, referralCode: incomingReferralCode }
    };
  }

  // Redirect MUST be outside try/catch or re-thrown if inside (but standard redirect() throws error so better outside if success)
  redirect("/dashboard");
}

export async function updateUserAction(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string)?.replace(/\s/g, "");
  const nif = (formData.get("nif") as string)?.replace(/\s/g, "");
  const address = formData.get("address") as string;

  // Basic Validation
  if (phone && !/^(\+)?[0-9]{7,15}$/.test(phone)) {
    return { error: "Telemóvel inválido (7-15 dígitos)" };
  }
  if (nif && !/^[0-9]{9}$/.test(nif)) {
    return { error: "NIF inválido (9 dígitos)" };
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: { name, phone, nif, address },
    });
    revalidatePath("/dashboard");
    return { success: "Dados atualizados com sucesso!" };
  } catch (e) {
    return { error: "Erro ao atualizar dados." };
  }
}
