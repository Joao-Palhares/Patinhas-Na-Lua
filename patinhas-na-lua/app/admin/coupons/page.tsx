import { db } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminCouponsPage() {

    // 1. Fetch Active Coupons
    const activeCoupons = await db.coupon.findMany({
        where: { active: true },
        include: { user: true },
        orderBy: { createdAt: "desc" }
    });

    // 2. Fetch Used Coupons (History) - Limit 20
    const usedCoupons = await db.coupon.findMany({
        where: { active: false },
        include: { user: true },
        orderBy: { usedAt: "desc" },
        take: 20
    });

    // 3. Fetch Top Loyal Users (High points > 70)
    const topUsers = await db.user.findMany({
        where: { loyaltyPoints: { gte: 70 } },
        orderBy: { loyaltyPoints: "desc" },
        take: 10
    });

    // Ensure Table Exists (Migration Hack)
    await db.$executeRaw`
       CREATE TABLE IF NOT EXISTS "LoyaltyReward" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "pointsCost" INTEGER NOT NULL,
          "serviceId" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE
       );
    `;

    const rewards = await db.$queryRaw<any[]>`
        SELECT 
            r."id", 
            r."pointsCost", 
            r."serviceId", 
            r."isActive", 
            r."discountPercentage", 
            r."maxDiscountAmount",
            s.name as "serviceName"
        FROM "LoyaltyReward" r
        JOIN "Service" s ON r."serviceId" = s."id"
        ORDER BY r."pointsCost" ASC
    `;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Gestão de Prémios 🎟️</h1>
                    <p className="text-gray-500">Controlo de cupões emitidos e fidelização.</p>
                </div>
                <Link href="/admin/scan">
                    <button className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2 transform hover:scale-105 active:scale-95">
                        <span className="text-xl">📷</span> <span className="hidden md:inline">Ler QR Code</span>
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN: ACTIVE COUPONS */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-blue-900 border-b pb-2">
                        Cupões Ativos ({activeCoupons.length})
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {activeCoupons.length === 0 ? (
                            <p className="p-8 text-center text-gray-400">Nenhum cupão ativo.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {activeCoupons.map(coupon => (
                                    <div key={coupon.id} className="p-4 hover:bg-slate-50 transition flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-gray-800 tracking-wider select-all cursor-pointer bg-gray-100 px-2 rounded">
                                                    {coupon.code}
                                                </span>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 rounded-full uppercase">
                                                    {coupon.discount === 100 ? "Oferta" : `-${coupon.discount}%`}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Cliente: <span className="font-bold text-gray-700">{coupon.user?.name || "Desconhecido"}</span>
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-gray-400">
                                            <p>{format(coupon.createdAt, "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-600 border-b pb-2 pt-8">
                        Histórico Recente
                    </h2>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-200/50">
                            {usedCoupons.map(coupon => (
                                <div key={coupon.id} className="p-3 flex justify-between items-center opacity-70">
                                    <div>
                                        <span className="font-mono text-xs font-bold text-gray-600 line-through">
                                            {coupon.code}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            {coupon.user?.name}
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-500 font-bold">
                                        USADO {coupon.usedAt ? format(coupon.usedAt, "dd/MM") : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: LOYALTY INSIGHTS */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-orange-600 border-b pb-2 flex items-center gap-2">
                        <span>🏆</span> Top Clientes (Sem Cupão)
                    </h2>
                    <p className="text-sm text-gray-500">Clientes com muitos pontos que ainda não geraram cupão. Sugira na loja!</p>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {topUsers.map(user => {
                                // Check if this user ALREADY has an active coupon in the list above to exclude them?
                                // Actually better to show them anyway so we know they are high value.
                                // Or highlight if they have enough for big prize.

                                const hasActiveCoupon = activeCoupons.find(c => c.userId === user.id);

                                return (
                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-orange-50/50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                                {user.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-orange-500">{user.loyaltyPoints}</p>
                                            {hasActiveCoupon ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                                                    TEM CUPÃO
                                                </span>
                                            ) : (
                                                <div className="flex gap-1 justify-end mt-1">
                                                    {rewards.filter(r => user.loyaltyPoints >= r.pointsCost).map(r => (
                                                        <span key={r.id} title={r.serviceName} className="text-xs bg-purple-100 text-purple-700 px-1 rounded font-bold cursor-help">
                                                            {r.pointsCost}pts
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
