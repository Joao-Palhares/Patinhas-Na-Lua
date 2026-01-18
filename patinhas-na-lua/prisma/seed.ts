
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seed: Force Re-Run...");

    // 1. SERVICES
    const services = [
        {
            name: "Banho",
            description: "Banho completo com champô adequado, secagem e escovagem.",
            category: "HYGIENE",
            allowsAddOns: true,
            options: [
                { price: 15, duration: 60, size: "SMALL", coat: "SHORT" },
                { price: 20, duration: 90, size: "MEDIUM", coat: "SHORT" },
                { price: 25, duration: 120, size: "LARGE", coat: "SHORT" },
                { price: 20, duration: 90, size: "SMALL", coat: "LONG" },
                { price: 30, duration: 120, size: "MEDIUM", coat: "LONG" },
            ]
        },
        {
            name: "Banho + Tosquia Higiénica",
            description: "Banho + corte de unhas, limpeza de ouvidos e rapagem de zonas higiénicas.",
            category: "HYGIENE",
            allowsAddOns: true,
            options: [
                { price: 20, duration: 90, size: "SMALL", coat: "SHORT" },
                { price: 25, duration: 90, size: "MEDIUM", coat: "SHORT" },
                { price: 35, duration: 120, size: "LARGE", coat: "SHORT" },
            ]
        },
        {
            name: "Tosquia Completa",
            description: "Corte completo à tesoura ou máquina conforme a raça.",
            category: "GROOMING",
            allowsAddOns: true,
            options: [
                { price: 30, duration: 120, size: "SMALL", coat: "LONG" },
                { price: 40, duration: 150, size: "MEDIUM", coat: "LONG" },
                { price: 55, duration: 180, size: "LARGE", coat: "LONG" },
            ]
        },
        {
            name: "Stripping",
            description: "Remoção de pelo morto para raças de pelo cerdoso.",
            category: "GROOMING",
            allowsAddOns: false,
            options: [
                { price: 40, duration: 120, size: "SMALL", coat: "SHORT" },
                { price: 50, duration: 150, size: "MEDIUM", coat: "SHORT" },
            ]
        },
        {
            name: "Corte de Unhas",
            description: "Apenas corte de unhas.",
            category: "HYGIENE",
            allowsAddOns: false,
            isMobileAvailable: true,
            options: [
                { price: 5, duration: 15, size: null, coat: null }, // General
            ]
        }
    ];

    for (const s of services) {
        const exists = await prisma.service.findFirst({ where: { name: s.name } });
        if (!exists) {
            const service = await prisma.service.create({
                data: {
                    name: s.name,
                    description: s.description,
                    category: s.category as any,
                    allowsAddOns: s.allowsAddOns,
                    // @ts-ignore
                    isMobileAvailable: s.isMobileAvailable || false,
                }
            });

            for (const o of s.options) {
                await prisma.serviceOption.create({
                    data: {
                        serviceId: service.id,
                        price: o.price,
                        durationMin: o.duration,
                        petSize: o.size as any,
                        coatType: o.coat as any
                    }
                });
            }
            console.log(`+ Created Service: ${s.name}`);
        } else {
            console.log(`= Skipped Service: ${s.name} (Exists)`);
        }
    }

    // 2. BUSINESS SETTINGS
    // Check if exists
    const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
        await prisma.businessSettings.create({
            data: {
                id: "default",
                baseLatitude: 39.8236,
                baseLongitude: -7.4919,
                baseAddress: "R. Dra. Maria de Fátima Delgado Domingos Farinha Lote 237 Loja 3, 6000-410 Castelo Branco",
                zone1RadiusKm: 5,
                zone1Fee: 5,
                zone2RadiusKm: 10,
                zone2Fee: 10,
                zone3Fee: 15,
                maxRadiusKm: 20
            }
        });
        console.log("+ Created Settings");
    }

    // 3. WORKING DAYS
    const count = await prisma.workingDay.count();
    if (count === 0) {
        const days = [1, 2, 3, 4, 5]; // Mon-Fri
        for (const day of days) {
            await prisma.workingDay.create({
                data: {
                    dayOfWeek: day,
                    startTime: "09:00",
                    endTime: "18:00",
                    breakStartTime: "12:30",
                    breakEndTime: "14:00"
                }
            });
        }
        // Saturday
        await prisma.workingDay.create({
            data: {
                dayOfWeek: 6,
                startTime: "09:00",
                endTime: "13:00",
                isClosed: false
            }
        });
        // Sunday
        await prisma.workingDay.create({
            data: {
                dayOfWeek: 0,
                isClosed: true
            }
        });
        console.log("+ Created Working Days");
    }

    console.log("✅ Seed Complete.");
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
