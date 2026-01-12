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
