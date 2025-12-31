"use client";

import { useState } from "react";
import { redeemReward } from "./actions";
import { useRouter } from "next/navigation";

interface Props {
    userPoints: number;
}

const REWARDS = [
    {
        id: 1,
        title: "Corte de Unhas",
        cost: 70,
        icon: "🎁",
        desc: "Mantenha as patas saudáveis.",
    },
    {
        id: 2,
        title: "Escovagem Dentes",
        cost: 150,
        icon: "🧼",
        desc: "Hálito fresco e sorriso brilhante.",
    },
    {
        id: 3,
        title: "Limpeza Completa",
        cost: 300,
        icon: "🏆",
        desc: "Banho, tosquia e corte de unhas.",
    }
];

export default function RewardsClient({ userPoints }: Props) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [claimedCode, setClaimedCode] = useState<string | null>(null);

    const handleRedeem = async (rewardId: number, cost: number, title: string) => {
        if (!confirm(`Tem a certeza que quer trocar ${cost} patinhas por "${title}"?`)) return;

        setLoadingId(rewardId);
        const res = await redeemReward(cost, title);

        if (res.success && res.code) {
            setClaimedCode(res.code);
            router.refresh();
        } else {
            alert(res.message || "Erro ao resgatar.");
        }
        setLoadingId(null);
    };

    // --- PROGRESS CALCULATION FOR HORIZONTAL BAR (Visual Only) ---
    // We want to map points to the 3 visual milestones: 33%, 66%, 100%
    // 0-70pts      -> 0% to 33%
    // 70-150pts    -> 33% to 66%
    // 150-300pts   -> 66% to 100%
    let progressPercent = 0;
    if (userPoints < 70) {
        progressPercent = (userPoints / 70) * 16; // 16% is halfway to first node roughly (start center)
    } else if (userPoints < 150) {
        progressPercent = 16 + ((userPoints - 70) / (150 - 70)) * 34; // 16 start + 34 = 50%
    } else if (userPoints < 300) {
        progressPercent = 50 + ((userPoints - 150) / (300 - 150)) * 34; // 50 start + 34 = 84%
    } else {
        progressPercent = 100;
    }

    // Correction for precise centering over nodes in CSS Grid
    // Node 1: ~16.6% | Node 2: ~50% | Node 3: ~83.3% inside the container?
    // Let's simplify: purely logic based percentages for the gradient bar.
    // Actually, let's stick to the visual alignment with grid columns.

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

    return (
        <div className="relative pt-8">

            {/* --- REWARDS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-20">

                {/* TRACK LINE (Behind everything) */}
                <div className="hidden md:block absolute top-[-2rem] left-[16%] right-[16%] h-3 bg-gray-200 rounded-full z-0"></div>
                <div
                    className="hidden md:block absolute top-[-2rem] left-[16%] h-3 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(68, (userPoints / 300) * 68)}%` }} // 68% is roughly the width from center of 1st to center of 3rd card
                ></div>

                {/* PAW AVATAR */}
                <div
                    className="hidden md:flex absolute top-[-2rem] w-10 h-10 bg-white border-4 border-orange-500 rounded-full items-center justify-center -translate-y-1/2 z-10 shadow-lg text-lg transition-all duration-1000"
                    style={{ left: `${16 + Math.min(68, (userPoints / 300) * 68)}%` }}
                >
                    🐾
                    <div className="absolute -top-10 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                        {userPoints} pts
                    </div>
                </div>


                {REWARDS.map((reward, index) => {
                    const unlocked = userPoints >= reward.cost;
                    const isNextGoal = !unlocked && (index === 0 || userPoints >= REWARDS[index - 1].cost);
                    const nodePassed = userPoints >= reward.cost;

                    return (
                        <div key={reward.id} className="relative flex flex-col md:block">

                            {/* NODE (Centered above the card) */}
                            <div className="hidden md:flex absolute -top-12 left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none z-20">
                                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold transition-all duration-500 ${nodePassed ? "bg-yellow-400 border-yellow-500 scale-110 shadow-lg" : "bg-white border-gray-300 text-gray-400"}`}>
                                    {nodePassed ? "✓" : index + 1}
                                </div>
                                <div className={`w-1 h-6 transition-colors duration-500 ${nodePassed ? "bg-yellow-400" : "bg-gray-200"}`}></div>
                            </div>

                            {/* MOBILE TIMELINE */}
                            <div className="md:hidden absolute left-4 top-0 bottom-0 w-1 bg-gray-100"></div>
                            <div className={`md:hidden absolute left-[10px] top-6 w-6 h-6 rounded-full border-4 z-10 transition-colors ${nodePassed ? "bg-blue-500 border-blue-200" : "bg-white border-gray-300"}`}></div>

                            {/* CARD CONTENT */}
                            <div className={`pl-12 md:pl-6 flex-1 flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${unlocked
                                ? "bg-white border-yellow-400 shadow-md scale-[1.02]"
                                : isNextGoal
                                    ? "bg-white border-blue-200 shadow-sm border-dashed"
                                    : "bg-gray-50 border-gray-100 opacity-70 grayscale"
                                }`}>

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-full text-2xl ${unlocked ? "bg-yellow-100" : "bg-gray-100"}`}>
                                        {reward.icon}
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${unlocked ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {reward.cost} pts
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg mb-1">{reward.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{reward.desc}</p>

                                <button
                                    onClick={() => handleRedeem(reward.id, reward.cost, reward.title)}
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
