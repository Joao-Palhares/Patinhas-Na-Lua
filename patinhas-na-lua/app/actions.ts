"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Não autorizado");
  }

  const phone = formData.get("phone") as string;
  const nif = formData.get("nif") as string;
  const address = formData.get("address") as string;
  const name = formData.get("name") as string;

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

  // ---------------------------------

  await db.user.create({
    data: {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: name,
      phone: phone,
      nif: nif,
      address: address,
    },
  });

  redirect("/dashboard");
}