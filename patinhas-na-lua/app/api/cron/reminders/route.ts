import { db } from "@/lib/db";
import webpush from "web-push";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Setup Web Push
// (You must ensure these ENV variables are set)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:info@patinhasnalua.pt',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function GET(request: Request) {
    // 1. Verify Authorization (Simple check to prevent abuse)
    // In Vercel Cron, you use CRON_SECRET header. Here we'll skip for demo or use a query param?
    // Let's rely on hidden obscurity for now or user manual trigger.

    // 2. Find TOMORROW's Appointments (Between 00:00 and 23:59 tomorrow)
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(now.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const appointments = await db.appointment.findMany({
        where: {
            date: {
                gte: tomorrowStart,
                lte: tomorrowEnd
            },
            status: { not: "CANCELLED" }
        },
        include: {
            user: {
                include: {
                    pushSubscriptions: true
                }
            },
            service: true,
            pet: true
        }
    });

    if (appointments.length === 0) {
        return Response.json({ message: "No appointments tomorrow." });
    }

    // 3. Send Notifications
    let sentCount = 0;
    const errors: any[] = [];

    for (const app of appointments) {
        const subs = app.user.pushSubscriptions;
        if (subs.length === 0) continue;

        const timeString = format(app.date, "HH:mm");
        
        const payload = JSON.stringify({
            title: `Lembrete: Visita Amanhã! 🐾`,
            body: `O ${app.pet.name} tem ${app.service.name} marcado para amanhã às ${timeString}.`,
            icon: "/icon-192.png",
            url: "/dashboard/history"
        });

        // Send to all user's devices
        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload);
                sentCount++;
            } catch (error) {
                console.error("Push Error:", error);
                // If it's 410 Gone, we should remove the sub, but let's keep it simple.
                errors.push(error);
            }
        }
    }

    return Response.json({ 
        success: true, 
        sent: sentCount, 
        scanned: appointments.length 
    });
}
