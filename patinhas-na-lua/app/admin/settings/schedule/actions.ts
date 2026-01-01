"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateWorkingDay(formData: FormData) {
    const dayOfWeek = Number(formData.get("dayOfWeek"));
    const startTime = formData.get("startTime") as string;
    const breakStartTime = formData.get("breakStartTime") as string;
    const breakEndTime = formData.get("breakEndTime") as string;
    const endTime = formData.get("endTime") as string;
    const isClosed = formData.get("isClosed") === "on";

    const id = crypto.randomUUID();

    await db.$executeRaw`
      INSERT INTO "WorkingDay" ("id", "dayOfWeek", "startTime", "breakStartTime", "breakEndTime", "endTime", "isClosed")
      VALUES (${id}, ${dayOfWeek}, ${startTime}, ${breakStartTime}, ${breakEndTime}, ${endTime}, ${isClosed})
      ON CONFLICT ("dayOfWeek") 
      DO UPDATE SET 
        "startTime" = ${startTime}, 
        "breakStartTime" = ${breakStartTime}, 
        "breakEndTime" = ${breakEndTime},
        "endTime" = ${endTime}, 
        "isClosed" = ${isClosed}
    `;
    revalidatePath("/admin/settings/schedule");
}

export async function addAbsence(formData: FormData) {
    const startStr = formData.get("startDate") as string;
    const endStr = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Check for overlaps
    const overlaps = await db.$queryRaw<any[]>`
        SELECT "id" FROM "Absence"
        WHERE "startDate" <= ${endDate} AND "endDate" >= ${startDate}
        LIMIT 1
    `;

    if (overlaps.length > 0) {
        // TODO: Handle user feedback better. For now, we prevent double booking.
        return;
    }

    const id = crypto.randomUUID();

    await db.$executeRaw`
      INSERT INTO "Absence" ("id", "startDate", "endDate", "reason")
      VALUES (${id}, ${startDate}, ${endDate}, ${reason})
    `;
    revalidatePath("/admin/settings/schedule");
    revalidatePath("/admin/vacations");
}

export async function deleteAbsence(formData: FormData) {
    const id = formData.get("id") as string;
    await db.$executeRaw`DELETE FROM "Absence" WHERE "id" = ${id}`;
    revalidatePath("/admin/settings/schedule");
    revalidatePath("/admin/vacations");
}

export async function checkScheduleConflicts(dayOfWeek: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conflicts = await db.$queryRaw<any[]>`
    SELECT 
      a."id", 
      a."date", 
      u."name" as "clientName", 
      u."email" as "clientEmail",
      s."name" as "serviceName"
    FROM "Appointment" a
    JOIN "User" u ON a."userId" = u."id"
    JOIN "Service" s ON a."serviceId" = s."id"
    WHERE a."status" != 'CANCELLED'
      AND a."date" >= ${today}
      AND EXTRACT(DOW FROM a."date") = ${dayOfWeek}
    ORDER BY a."date" ASC
    LIMIT 50
  `;

    return conflicts;
}
