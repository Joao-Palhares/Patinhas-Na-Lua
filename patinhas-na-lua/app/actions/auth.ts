"use server";


import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";

interface InviteClientProps {
  name: string;
  email: string;
  nif?: string;
  phone?: string;
}

export async function inviteClient(data: InviteClientProps) {
  // 1. Security Check
  await requireAdmin();

  const { name, email, nif, phone } = data;

  if (!email) {
    throw new Error("Email é obrigatório.");
  }

  // 2. Check overlap
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Já existe um utilizador com este email.");
  }

  // 3. Create Local User (Status: INVITED)
  // We generate a temporary ID (Cuid) which will be linked later via Webhook
  // Note: The 'id' field satisfies the @id requirement.
  const newUser = await db.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      nif,
      phone,
      // @ts-ignore
      status: "INVITED",
      isAdmin: false,
      // We rely on defaults for others
    },
  });

  // 4. Send Clerk Invitation
  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` 
    : "http://localhost:3000/dashboard";

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: redirectUrl,
      publicMetadata: {
        internalUserId: newUser.id, // CRITICAL for Webhook linking
      },
      ignoreExisting: true,
    });
  } catch (error) {
    console.error("Clerk Invitation Error:", error);
    // Optional: Rollback user creation? 
    // For now, we keep it but throw error so UI knows invite failed
    throw new Error("Erro ao enviar convite via Clerk.");
  }

  return { 
    success: true, 
    message: "Cliente registado e convite enviado com sucesso." 
  };
}
