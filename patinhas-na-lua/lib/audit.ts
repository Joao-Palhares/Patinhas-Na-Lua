import { db } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { AuditAction } from "@prisma/client";

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
    // Silently fail - don't block the main action
    Sentry.captureException(error, { tags: { source: 'auditLog' } });
  }
}

/**
 * Log an error to both the AuditLog and Sentry
 */
export async function logError(
  error: Error | unknown,
  context: string,
  additionalData?: Record<string, any>
) {
  // 1. Send to Sentry (for stack traces and detailed error info)
  Sentry.captureException(error, {
    tags: { context },
    extra: additionalData
  });

  // 2. Also log to our database for easy viewing in admin
  const errorMessage = error instanceof Error 
    ? `${error.name}: ${error.message}` 
    : String(error);
  
  await logAudit(
    "ERROR" as AuditAction,
    context,
    null,
    errorMessage.substring(0, 500), // Limit size
    additionalData,
    null
  );
}

/**
 * Log a page view for analytics
 */
export async function logPageView(pagePath: string) {
  await logAudit(
    "PAGE_VIEW" as AuditAction,
    "Page",
    null,
    pagePath
  );
}

