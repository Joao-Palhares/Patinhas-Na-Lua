import { db } from "@/lib/db";
import { deleteReward } from "./actions";
import AddRewardForm from "./add-reward-form";

export default async function RewardsSettingsPage() {
    // 2. Fetch Services with Options
    const services = await db.service.findMany({
        orderBy: { name: "asc" },
        include: {
            options: {
                orderBy: { price: 'asc' }
            }
        }
    });

    // 3. Fetch Rewards (Standard Prisma)
    const rewardsRaw = await db.loyaltyReward.findMany({
        orderBy: { pointsCost: 'asc' },
        include: { 
            service: true,
            serviceOption: true // NEW
        }
    });

    const rewards = rewardsRaw.map(r => ({
        id: r.id,
        pointsCost: r.pointsCost,
        serviceId: r.serviceId,
        isActive: r.isActive,
        discountPercentage: r.discountPercentage,
        maxDiscountAmount: r.maxDiscountAmount ? Number(r.maxDiscountAmount) : null,
        serviceName: r.service.name,
        serviceCategory: r.service.category,
        // NEW
        optionName: r.serviceOption ? `${r.serviceOption.price}€` : null, // Simplistic representation, improved below
        optionDetails: r.serviceOption,
    }));

    const formatCategory = (cat: string) => {
        if (cat === 'GROOMING') return 'Cão';
        if (cat === 'EXOTIC') return 'Gato/Coelho';
        if (cat === 'SPA') return 'Spa';
        if (cat === 'HYGIENE') return 'Higiene';
        return cat;
    };

    const formatOption = (opt: any) => {
        if (!opt) return null;
        const size = opt.petSize ? opt.petSize : 'Tamanho Único';
        const coat = opt.coatType ? opt.coatType : 'Pelo Padrão';
        return `${size} - ${coat}`;
    };

    // Serialize Services for Client Component (Decimal -> Number)
    const serializedServices = services.map(s => ({
        ...s,
        options: s.options.map(opt => ({
            ...opt,
            price: Number(opt.price)
        }))
    }));

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
                    <AddRewardForm services={serializedServices} />
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
                                    <p className="font-bold text-gray-900 flex items-center gap-2 flex-wrap leading-tight">
                                        {reward.serviceName}
                                        {reward.discountPercentage < 100 && (
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 rounded-full border border-green-200">
                                                -{100 - reward.discountPercentage}% OFF
                                            </span>
                                        )}
                                        {reward.maxDiscountAmount && !reward.optionDetails && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 rounded-full border border-blue-200">
                                                Até {Number(reward.maxDiscountAmount)}€
                                            </span>
                                        )}
                                    </p>
                                    
                                    {/* Option Details */}
                                    {reward.optionDetails && (
                                        <p className="text-xs font-bold text-purple-600 mt-0.5">
                                            {formatOption(reward.optionDetails)} ({Number(reward.optionDetails.price)}€)
                                        </p>
                                    )}

                                    {!reward.optionDetails && (
                                        <p className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-1 rounded mt-0.5">
                                            {formatCategory(reward.serviceCategory)} (Genérico)
                                        </p>
                                    )}
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
