import { db } from "@/app/lib/db";
import { auth } from "@clerk/nextjs/server";
import { AuditAction } from "@prisma/client";

interface LogAuditParams {
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
}

export async function logAudit({
  action,
  entity,
  entityId,
  details,
  oldValue,
  newValue,
}: LogAuditParams) {
  try {
    const { userId } = await auth();

    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        userId: userId || "SYSTEM", // Fallback if no user (e.g. cron job)
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw, so we don't block the main action
  }
}
