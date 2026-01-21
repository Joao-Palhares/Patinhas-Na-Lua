import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ForceSignOutOverlay from "./force-sign-out-overlay";

export default async function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  // 1. If public (no session), allow access
  if (!userId) {
    return <>{children}</>;
  }

  // 2. Check Database Status
  // We use findUnique which is fast. 
  // NOTE: If using "Soft Delete" logic where findUnique excludes deleted, 
  // you might need findFirst + filter if you want to detect "it exists but is deleted".
  // BUT: Prisma `findUnique` usually does NOT filter soft deletes automatically unless middleware is set.
  // We haven't configured global Prisma middleware for soft deletes, so `findUnique` WILL return the user even if `deletedAt` is set.
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  // 3. Handle Ghost User (Cookie exists, DB record missing)
  if (!user) {
    // This happens if DB was wiped but browser cookie remains, or ID reconciliation failed.
    console.error(`[AuthGuard] Ghost User Detected: ${userId}`);
    return <ForceSignOutOverlay reason="Account Not Found" />;
  }

  // 4. Handle Soft Deleted User (Zombie Session)
  if (user.deletedAt) {
    console.warn(`[AuthGuard] Zombie Session Detected (Soft Deleted): ${userId}`);
    return <ForceSignOutOverlay reason="Account Deactivated" />;
  }

  // 5. Handle Blacklisted/Banned (Optional)
  if (user.isBlacklisted) {
     return <ForceSignOutOverlay reason="Account Deactivated" />; // Or "Banned"
  }

  // 6. Access Granted
  // Render the actual page content
  return <>{children}</>;
}
