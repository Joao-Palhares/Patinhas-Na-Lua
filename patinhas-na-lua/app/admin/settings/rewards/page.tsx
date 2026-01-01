import { db } from "@/lib/db";
import { deleteReward } from "./actions";
import AddRewardForm from "./add-reward-form";

export default async function RewardsSettingsPage() {
    // 1. Ensure Table Exists (Migration Hack)
    try {
        await db.$executeRaw`
           CREATE TABLE IF NOT EXISTS "LoyaltyReward" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "pointsCost" INTEGER NOT NULL,
              "serviceId" TEXT NOT NULL,
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "discountPercentage" INTEGER DEFAULT 100,
              FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE
           );
        `;

        try {
            await db.$executeRaw`ALTER TABLE "LoyaltyReward" ADD COLUMN "discountPercentage" INTEGER DEFAULT 100`;
        } catch (e) { }
        try {
            await db.$executeRaw`ALTER TABLE "LoyaltyReward" ADD COLUMN "maxDiscountAmount" DECIMAL(10,2)`;
        } catch (e) { }
    } catch (e) { }

    // 2. Fetch Services
    const services = await db.service.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true }
    });

    // 3. Fetch Rewards
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
        ORDER BY r."pointsCost" ASC
    `;

    const formatCategory = (cat: string) => {
        if (cat === 'GROOMING') return 'Cão';
        if (cat === 'EXOTIC') return 'Gato/Coelho';
        if (cat === 'SPA') return 'Spa';
        if (cat === 'HYGIENE') return 'Higiene';
        return cat;
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
            <div className="flex items-center gap-4 mb-8">
                <a href="/admin/settings" className="text-gray-500 hover:text-gray-800 transition font-bold text-sm">← Voltar</a>
                <h1 className="text-3xl font-bold text-slate-800">Prémios de Fidelização 🎟️</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: ADD FORM */}
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg h-fit">
                    <h2 className="text-lg font-bold text-purple-900 mb-4 border-b pb-2">Adicionar Novo Prémio</h2>
                    <AddRewardForm services={services} />
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg text-xs text-purple-800">
                        <p><strong>Regra 5% ROI:</strong> O sistema multiplica o valor do serviço por 20 para garantir que o cliente gasta 20x esse valor para ganhar o prémio.</p>
                    </div>
                </div>

                {/* RIGHT: LIST */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Prémios Ativos</h2>

                    {rewards.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-400">Nenhum prémio configurado.</p>
                        </div>
                    )}

                    {rewards.map(reward => (
                        <div key={reward.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-purple-200 transition">
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-100 text-purple-700 font-bold text-xl px-4 py-2 rounded-lg min-w-[80px] text-center">
                                    {reward.pointsCost}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                        {reward.serviceName}
                                        {reward.discountPercentage < 100 && (
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 rounded-full border border-green-200">
                                                -{100 - reward.discountPercentage}% OFF
                                            </span>
                                        )}
                                        {reward.maxDiscountAmount && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 rounded-full border border-blue-200">
                                                Até {Number(reward.maxDiscountAmount)}€
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-1 rounded mt-0.5">
                                        {formatCategory(reward.serviceCategory)}
                                    </p>
                                </div>
                            </div>
                            <form action={deleteReward}>
                                <input type="hidden" name="id" value={reward.id} />
                                <button className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition" title="Remover">
                                    ✕
                                </button>
                            </form>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
