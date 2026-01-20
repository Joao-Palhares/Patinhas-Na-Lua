import { db } from "@/lib/db";
// import { AuditAction } from "@prisma/client";
type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "VIEW" | "EXPORT" | "SYSTEM";
import { headers } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";

export async function logAudit(
  action: AuditAction, 
  entity: string, 
  entityId: string | null = null, 
  details: string | object | null = null,
  oldValue: any = null,
  newValue: any = null
) {
  try {
    let userId = "SYSTEM";
    let ipAddress = "unknown";
    let userAgent = "unknown";

    // Try to get from Clerk
    try {
        const user = await currentUser();
        if (user) userId = user.id;
    } catch (e) {}

    // Try to get headers
    try {
        const h = await headers();
        const forwardedFor = h.get("x-forwarded-for");
        ipAddress = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";
        userAgent = h.get("user-agent") || "unknown";
    } catch(e) {}

    const detailsString = typeof details === "object" ? JSON.stringify(details) : details;

    // @ts-ignore
    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details: detailsString,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        userId,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error("Failed to write Audit Log:", error);
    // Do not throw, so we don't block the main action
  }
}
