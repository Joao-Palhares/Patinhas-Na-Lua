"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getBusinessSettings() {
    let settings = await db.businessSettings.findUnique({
        where: { id: "default" }
    });

    if (!settings) {
        settings = await db.businessSettings.create({
            data: {
                id: "default",
                baseLatitude: 40.5489, // Tondela
                baseLongitude: -8.0815,
                zone1RadiusKm: 5,
                zone1Fee: 0,
                zone2RadiusKm: 10,
                zone2Fee: 10,
                zone3Fee: 15,
                maxRadiusKm: 20
            }
        });
    }

    return {
        ...settings,
        zone1Fee: settings.zone1Fee.toNumber(),
        zone2Fee: settings.zone2Fee.toNumber(),
        zone3Fee: settings.zone3Fee.toNumber(),
    };
}

export async function saveBusinessSettings(formData: FormData) {
    const baseLatitude = parseFloat(formData.get("baseLatitude") as string);
    const baseLongitude = parseFloat(formData.get("baseLongitude") as string);

    const zone1RadiusKm = parseFloat(formData.get("zone1RadiusKm") as string);
    const zone1Fee = parseFloat(formData.get("zone1Fee") as string);

    const zone2RadiusKm = parseFloat(formData.get("zone2RadiusKm") as string);
    const zone2Fee = parseFloat(formData.get("zone2Fee") as string);

    const zone3Fee = parseFloat(formData.get("zone3Fee") as string);
    const maxRadiusKm = parseFloat(formData.get("maxRadiusKm") as string);
    const referralRewardPercentage = parseInt(formData.get("referralRewardPercentage") as string) || 5;

    await db.businessSettings.upsert({
        where: { id: "default" },
        update: {
            baseLatitude,
            baseLongitude,
            baseAddress: formData.get("baseAddress") as string,
            zone1RadiusKm,
            zone1Fee,
            zone2RadiusKm,
            zone2Fee,
            zone3Fee,
            maxRadiusKm,
            referralRewardPercentage
        },
        create: {
            id: "default",
            baseLatitude,
            baseLongitude,
            baseAddress: formData.get("baseAddress") as string,
            zone1RadiusKm,
            zone1Fee,
            zone2RadiusKm,
            zone2Fee,
            zone3Fee,
            maxRadiusKm,
            referralRewardPercentage
        }
    });

    revalidatePath("/admin/settings");
    revalidatePath("/dashboard/book"); // Update booking wizard cache too
    
    return { success: true };
}
