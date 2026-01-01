import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RewardsClient from "./rewards-client";

export default async function RewardsPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const dbUser = await db.user.findUnique({
        where: { id: user.id }
    });

    if (!dbUser) redirect("/onboarding");

    // Fetch Rewards
    const rewards = await db.$queryRaw<any[]>`
        SELECT 
            r."id", 
            r."pointsCost", 
            r."serviceId", 
            r."isActive", 
            r."discountPercentage", 
            r."maxDiscountAmount",
            s.name as "serviceName", 
            s.category as "serviceCategory"
        FROM "LoyaltyReward" r
        JOIN "Service" s ON r."serviceId" = s."id"
        WHERE r."isActive" = true
        ORDER BY r."pointsCost" ASC
    `;

    const rewardsSafe = rewards.map(r => ({
        ...r,
        maxDiscountAmount: r.maxDiscountAmount ? Number(r.maxDiscountAmount) : null
    }));

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* HEADER */}
            <div className="bg-blue-600 text-white pt-12 pb-24 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-10 -translate-y-10 blur-xl"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-400 opacity-20 rounded-full translate-x-10 translate-y-10 blur-2xl"></div>

                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
                    <div>
                        <Link href="/dashboard" className="text-blue-200 text-sm font-bold hover:text-white transition flex items-center gap-1 mb-2">
                            ← Voltar
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black mb-2">Clube Patinhas</h1>
                        <p className="text-blue-100 opacity-90 max-w-sm">
                            Cada 1€ gasto = 1 Patinha. Acumule e troque por serviços gratuitos!
                        </p>
                    </div>

                    <div className="mt-8 md:mt-0 bg-white/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-center gap-4 relative">
                        {/* COUPONS BUTTON (TOP RIGHT) */}
                        <Link href="/dashboard/coupons" className="absolute top-4 right-4 md:static">
                            <button className="bg-white text-blue-900 text-sm font-bold px-6 py-3 rounded-full shadow-lg hover:bg-blue-50 transition flex items-center gap-2 transform hover:scale-105 active:scale-95">
                                <span className="text-xl">🎟️</span> <span className="hidden md:inline">Meus</span> Cupões
                            </button>
                        </Link>

                        <div className="text-center md:text-left">
                            <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">O seu saldo</p>
                            <h2 className="text-5xl md:text-6xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                                {dbUser.loyaltyPoints}
                                <span className="text-2xl opacity-50">🐾</span>
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
                <RewardsClient userPoints={dbUser.loyaltyPoints} rewards={rewardsSafe} />
            </div>

        </div>
    );
}
