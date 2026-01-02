"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Não autorizado");
  }

  const phone = formData.get("phone") as string;
  const nif = formData.get("nif") as string;
  const address = formData.get("address") as string;
  const name = formData.get("name") as string;
  const incomingReferralCode = (formData.get("referralCode") as string)?.toUpperCase().trim();

  // --- SERVER SIDE VERIFICATIONS ---

  // 1. Validate Phone (Must be 9 digits, only numbers)
  const phoneRegex = /^[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Número de telemóvel inválido. Deve ter 9 dígitos.");
  }

  // 2. Validate NIF (Must be 9 digits, only numbers)
  const nifRegex = /^[0-9]{9}$/;
  if (!nifRegex.test(nif)) {
    throw new Error("NIF inválido. Deve ter 9 dígitos.");
  }

  // 3. Validate Incoming Referral Code (If provided)
  let referredById = null;
  if (incomingReferralCode) {
    // Check if code exists
    const referrer = await db.user.findUnique({
      where: { referralCode: incomingReferralCode }
    });

    if (!referrer) {
      throw new Error(`O código de convite "${incomingReferralCode}" não existe.`);
    }

    // Prevent self-referral (though rare in onboarding, safer to check)
    if (referrer.id === user.id) {
      throw new Error("Não podes usar o teu próprio código.");
    }

    referredById = referrer.id;
  }

  // ---------------------------------

  // 4. Generate A UNIQUE Referral Code for THIS new user (Auto-Generate)
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
    // Fallback if super unlucky: use a timestamp suffix
    newReferralCode = `PAT${Date.now().toString().slice(-6)}`;
  }


  // FIX: Use upsert to prevent "Unique constraint failed on email"
  // This handles cases where the user might already exist in the DB (e.g. from a previous failed attempt or manual entry)
  await db.user.upsert({
    where: { email: user.emailAddresses[0].emailAddress },
    update: {
      name: name,
      phone: phone,
      nif: nif,
      address: address,
      // We also update the ID to match the current Clerk ID, just in case
      id: user.id
    },
    create: {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: name,
      phone: phone,
      nif: nif,
      address: address,
      referralCode: newReferralCode, // <--- Auto Set Code
      referredById: referredById     // <--- Link to Referrer (if any)
    },
  });

  redirect("/dashboard");
}

export async function updateUserAction(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nif = formData.get("nif") as string;
  const address = formData.get("address") as string;

  // Basic Validation
  if (phone && !/^[0-9]{9}$/.test(phone)) {
    return { error: "Telemóvel inválido (9 dígitos)" };
  }
  if (nif && !/^[0-9]{9}$/.test(nif)) {
    return { error: "NIF inválido (9 dígitos)" };
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: { name, phone, nif, address }
    });
    revalidatePath("/dashboard");
    return { success: "Dados atualizados com sucesso!" };
  } catch (e) {
    return { error: "Erro ao atualizar dados." };
  }
}