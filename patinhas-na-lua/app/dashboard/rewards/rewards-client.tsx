"use client";

import { useState } from "react";
import { redeemReward } from "./actions";
import { useRouter } from "next/navigation";

interface Reward {
    id: string;
    pointsCost: number;
    discountPercentage: number;
    serviceName: string;
    serviceCategory: string;
}

interface Props {
    userPoints: number;
    rewards: Reward[];
}

export default function RewardsClient({ userPoints, rewards }: Props) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [claimedCode, setClaimedCode] = useState<string | null>(null);

    const handleRedeem = async (rewardId: string, cost: number, title: string) => {
        if (!confirm(`Tem a certeza que quer trocar ${cost} patinhas por "${title}"?`)) return;

        setLoadingId(rewardId);
        // Correctly pass rewardId to the server action
        const res = await redeemReward(rewardId);

        if (res.success && res.code) {
            setClaimedCode(res.code);
            router.refresh();
        } else {
            alert(res.message || "Erro ao resgatar.");
        }
        setLoadingId(null);
    };

    const getIcon = (cat: string) => {
        if (cat === 'GROOMING') return '✂️';
        if (cat === 'EXOTIC') return '🐰';
        if (cat === 'SPA') return '🛁';
        if (cat === 'HYGIENE') return '🧼';
        return '🎁';
    }

    // --- PROGRESS CALCULATION ---
    // Make it relative to the Max Cost reward
    const maxCost = rewards.length > 0 ? rewards[rewards.length - 1].pointsCost : 300;

    // Safety check for maxCost to avoid division by zero
    const safeMaxCost = maxCost > 0 ? maxCost : 300;
    const progressPercent = Math.min(100, (userPoints / safeMaxCost) * 100);

    if (claimedCode) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-2xl shadow-xl border-2 border-green-100 animate-in zoom-in duration-300">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Parabéns! Recompensa Desbloqueada</h2>
                <p className="text-gray-500 mb-6">Use este código no seu próximo agendamento:</p>

                <div className="bg-slate-100 p-4 rounded-xl border border-dashed border-gray-400 mb-6">
                    <span className="font-mono text-3xl font-black text-blue-600 tracking-widest">{claimedCode}</span>
                </div>

                <button
                    onClick={() => setClaimedCode(null)}
                    className="text-gray-500 underline text-sm hover:text-blue-600"
                >
                    Voltar aos prémios
                </button>
            </div>
        );
    }

    // Grid columns logic: min 3, or length if less than 3 (but at least 1)
    const gridCols = `grid-cols-1 md:grid-cols-${Math.max(1, Math.min(3, rewards.length))}`;

    return (
        <div className="relative pt-8">

            {/* --- REWARDS GRID --- */}
            <div className={`grid ${gridCols} gap-8 relative mt-20`}>

                {/* TRACK LINE (Behind everything) */}
                <div className="hidden md:block absolute top-[-2rem] left-[10%] right-[10%] h-3 bg-gray-200 rounded-full z-0"></div>
                <div
                    className="hidden md:block absolute top-[-2rem] left-[10%] h-3 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(80, (userPoints / safeMaxCost) * 80)}%` }}
                ></div>

                {/* PAW AVATAR */}
                <div
                    className="hidden md:flex absolute top-[-2rem] w-10 h-10 bg-white border-4 border-orange-500 rounded-full items-center justify-center -translate-y-1/2 z-10 shadow-lg text-lg transition-all duration-1000"
                    style={{ left: `${10 + Math.min(80, (userPoints / safeMaxCost) * 80)}%` }}
                >
                    🐾
                    <div className="absolute -top-10 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                        {userPoints} pts
                    </div>
                </div>


                {rewards.map((reward, index) => {
                    const cost = reward.pointsCost;
                    const unlocked = userPoints >= cost;
                    const isNextGoal = !unlocked && (index === 0 || userPoints >= rewards[index - 1].pointsCost);

                    // LOGIC: DiscountPercentage is % OFF. 100 = Free. 20 = 20% Off.
                    const isFree = reward.discountPercentage === 100;
                    const title = reward.serviceName + (isFree ? " (Grátis)" : ` (-${reward.discountPercentage}%)`);

                    const desc = isFree
                        ? "Serviço completo gratuito. Aproveite!"
                        : `Desconto de ${reward.discountPercentage}% neste serviço.`;

                    return (
                        <div key={reward.id} className="relative flex flex-col md:block">

                            {/* NODE (Centered above the card) */}
                            <div className="hidden md:flex absolute -top-12 left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none z-20">
                                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold transition-all duration-500 ${unlocked ? "bg-yellow-400 border-yellow-500 scale-110 shadow-lg" : "bg-white border-gray-300 text-gray-400"}`}>
                                    {unlocked ? "✓" : index + 1}
                                </div>
                                <div className={`w-1 h-6 transition-colors duration-500 ${unlocked ? "bg-yellow-400" : "bg-gray-200"}`}></div>
                            </div>

                            {/* MOBILE TIMELINE */}
                            <div className="md:hidden absolute left-4 top-0 bottom-0 w-1 bg-gray-100"></div>
                            <div className={`md:hidden absolute left-[10px] top-6 w-6 h-6 rounded-full border-4 z-10 transition-colors ${unlocked ? "bg-blue-500 border-blue-200" : "bg-white border-gray-300"}`}></div>

                            {/* CARD CONTENT */}
                            <div className={`pl-12 md:pl-6 flex-1 flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${unlocked
                                ? "bg-white border-yellow-400 shadow-md scale-[1.02]"
                                : isNextGoal
                                    ? "bg-white border-blue-200 shadow-sm border-dashed"
                                    : "bg-gray-50 border-gray-100 opacity-70 grayscale"
                                }`}>

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-full text-2xl ${unlocked ? "bg-yellow-100" : "bg-gray-100"}`}>
                                        {getIcon(reward.serviceCategory)}
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${unlocked ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {cost} pts
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg mb-1">{title}</h3>
                                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{desc}</p>

                                <button
                                    onClick={() => handleRedeem(reward.id, cost, title)}
                                    disabled={!unlocked || loadingId !== null}
                                    className={`w-full py-3 rounded-xl font-bold transition shadow-sm ${unlocked
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    {loadingId === reward.id ? (
                                        <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    ) : unlocked ? (
                                        "Resgatar Oferta"
                                    ) : (
                                        `Bloqueado`
                                    )}
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}
