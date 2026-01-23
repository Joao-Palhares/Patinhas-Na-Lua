import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const dbUser = await db.user.findUnique({ 
    where: { id: user.id },
    select: { isAdmin: true }
  });

  if (!dbUser?.isAdmin) {
    throw new Error("Forbidden: Admin privileges required.");
  }

  return user;
}

// Safe version that returns an error object instead of throwing
// Use this in Server Actions to return errors gracefully
export async function checkAdminAccess(): Promise<{ error?: string; userId?: string }> {
  const user = await currentUser();
  
  if (!user) {
    return { error: "Não autorizado. Por favor faça login." };
  }

  const dbUser = await db.user.findUnique({ 
    where: { id: user.id },
    select: { isAdmin: true }
  });

  if (!dbUser?.isAdmin) {
    return { error: "Acesso negado. Privilégios de administrador necessários." };
  }

  return { userId: user.id };
}

// Rate limiting for admin actions (prevents abuse from compromised accounts)
// Returns error message if rate limited, null otherwise
export async function checkAdminRateLimit(actionKey: string, maxAttempts: number = 10): Promise<string | null> {
  const user = await currentUser();
  if (!user) return "Não autorizado";

  const key = `admin:${user.id}:${actionKey}`;
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const attempts = await db.rateLimit.count({
    where: {
      key: key,
      createdAt: { gte: tenMinutesAgo }
    }
  });

  if (attempts >= maxAttempts) {
    return `Muitas tentativas (${actionKey}). Aguarde 10 minutos.`;
  }

  // Record this attempt
  await db.rateLimit.create({ data: { key } });
  
  return null;
}

