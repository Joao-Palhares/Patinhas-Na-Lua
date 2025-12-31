import { db } from "@/lib/db";
import { sendAppointmentReminder } from "@/lib/email";

// This is a specialized API Route for Vercel Cron Jobs.
// It should be called once a day (e.g., at 8 AM).
// GET /api/cron/reminders

export const dynamic = 'force-dynamic'; // Static by default, we need dynamic

export async function GET(request: Request) {
    // Security check: Ensure only Vercel (or you manually) can trigger this
    // In Vercel, CRON_SECRET is auto-injected.
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new Response('Unauthorized', { status: 401 });
        // For now, let's keep it open for testing or add a manual secret
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(23, 59, 59, 999); // End of tomorrow

    console.log(`🔍 Checking appointments for tomorrow: ${tomorrow.toISOString().split('T')[0]}`);

    // Fetch appointments for TOMORROW that are not cancelled
    const appointments = await db.appointment.findMany({
        where: {
            date: { gte: tomorrow, lte: dayAfter },
            status: { not: "CANCELLED" }
        },
        include: {
            user: true,
            pet: true
        }
    });

    console.log(`📬 Found ${appointments.length} appointments to remind.`);

    let sentCount = 0;

    for (const app of appointments) {
        if (!app.user.email) continue;

        const timeStr = app.date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
        const dateStr = app.date.toLocaleDateString("pt-PT");

        console.log(`   -> Sending to ${app.user.email} (${app.pet.name} at ${timeStr})`);

        // Fire and Forget (don't await strictly if not needed, but here we await to avoid rate limits)
        await sendAppointmentReminder({
            to: app.user.email,
            userName: app.user.name || "Cliente",
            petName: app.pet.name,
            dateStr,
            timeStr
        });

        sentCount++;
    }

    return Response.json({ success: true, sent: sentCount });
}
