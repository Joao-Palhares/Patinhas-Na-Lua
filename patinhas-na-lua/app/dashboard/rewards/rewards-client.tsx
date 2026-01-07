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

    // --- LAYOUT CONSTANTS ---
    const CARD_WIDTH = 320;
    const CARD_GAP = 24;
    const CONTAINER_PADDING = 100; // Optimized for 3 items (Start Node ~10px)

    // Geometry calculations
    const STRIDE = CARD_WIDTH + CARD_GAP;
    const FIRST_CARD_CENTER = CONTAINER_PADDING + (CARD_WIDTH / 2);
    const START_NODE_POSITION = FIRST_CARD_CENTER - 250;

    // Track Geometry
    // Starts at START_NODE_POSITION (0 pts)
    // Ends at the center of the last reward card
    const lastCardPosition = FIRST_CARD_CENTER + ((rewards.length > 0 ? rewards.length - 1 : 0) * STRIDE);
    const trackStart = START_NODE_POSITION;
    const TRACK_END_PADDING = 180; // Extended tail
    const trackWidth = (lastCardPosition - trackStart) + TRACK_END_PADDING;

    // --- PROGRESS CALCULATION ---
    let pawPositionPixels = 0; // Relative to track start

    if (rewards.length > 0) {
        if (userPoints < rewards[0].pointsCost) {
            // Segment: Start -> Reward 1
            const segmentLength = FIRST_CARD_CENTER - START_NODE_POSITION;
            const progressRatio = Math.max(0, Math.min(1, userPoints / rewards[0].pointsCost));
            pawPositionPixels = progressRatio * segmentLength;
        } else {
            // Segment: Reward i -> Reward i+1
            let lastUnlockedIndex = 0;
            for (let i = 0; i < rewards.length; i++) {
                if (userPoints >= rewards[i].pointsCost) {
                    lastUnlockedIndex = i;
                }
            }

            const distToLastUnlocked = (FIRST_CARD_CENTER - START_NODE_POSITION) + (lastUnlockedIndex * STRIDE);

            let segmentProgressPixels = 0;
            if (lastUnlockedIndex < rewards.length - 1) {
                const currentFn = rewards[lastUnlockedIndex].pointsCost;
                const nextFn = rewards[lastUnlockedIndex + 1].pointsCost;
                const range = nextFn - currentFn;
                const progress = userPoints - currentFn;
                const ratio = Math.max(0, Math.min(1, progress / range));
                segmentProgressPixels = ratio * STRIDE;
            } else {
                segmentProgressPixels = 0;
            }

            pawPositionPixels = distToLastUnlocked + segmentProgressPixels;
        }
    }

    // Convert to % for CSS
    const progressPercent = trackWidth > 0 ? (pawPositionPixels / trackWidth) * 100 : 0;
    const safeProgressPercent = Math.min(100, Math.max(0, progressPercent));


    // --- CAROUSEL LOGIC ---
    const ITEMS_PER_PAGE = 3;
    const TOTAL_PAGES = Math.max(1, Math.ceil(rewards.length / ITEMS_PER_PAGE)); // Ensure at least 1 page

    // Initialize page
    const initialActiveIndex = rewards.findIndex(r => userPoints < r.pointsCost);
    const targetIndex = initialActiveIndex === -1 ? rewards.length - 1 : initialActiveIndex;
    const initialPage = Math.floor(Math.max(0, targetIndex) / ITEMS_PER_PAGE);

    const [currentPage, setCurrentPage] = useState(initialPage);

    // Handlers
    const nextPage = () => setCurrentPage(p => Math.min(TOTAL_PAGES - 1, p + 1));
    const prevPage = () => setCurrentPage(p => Math.max(0, p - 1));

    // Calculate Transform
    // We want to shift by (Page Index * 3 Items * Stride).
    // The Container Padding (320px) stays constant inside the moving container, so page 0 starts with padding.
    const transformX = currentPage * ITEMS_PER_PAGE * STRIDE;


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
        <div className="relative w-full">
            {/* Navigation Buttons - Always Visible */}
            <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full shadow-lg border-2 transition-all ${currentPage === 0 ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-100 hover:border-blue-500 hover:scale-110'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>

            <button
                onClick={nextPage}
                disabled={currentPage >= TOTAL_PAGES - 1} // Disabled if last page or only 1 page
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full shadow-lg border-2 transition-all ${currentPage >= TOTAL_PAGES - 1 ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-100 hover:border-blue-500 hover:scale-110'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>

            {/* Carousel Container */}
            <div className="overflow-hidden pb-12 pt-4 w-full px-2">
                <div
                    className="flex items-start min-w-max relative pt-24 transition-transform duration-700 ease-in-out"
                    style={{
                        gap: `${CARD_GAP}px`,
                        paddingLeft: `${CONTAINER_PADDING}px`,
                        paddingRight: '0px',
                        transform: `translateX(-${transformX}px)`
                    }}
                >

                    {/* TRACK & PROGRESS CONTAINER */}
                    <div
                        className="absolute top-12 h-8 bg-gray-200 rounded-full z-0 shadow-inner"
                        style={{
                            left: `${START_NODE_POSITION}px`,
                            width: `${trackWidth}px`
                        }}
                    >
                        {/* START DOT (0 PTS) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out relative shadow-md"
                            style={{ width: `${safeProgressPercent}%` }}
                        >
                            {/* PAW AVATAR */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-14 h-14 bg-white border-4 border-orange-500 rounded-full flex items-center justify-center shadow-xl z-20 transition-transform duration-300 hover:scale-110">
                                <span className="text-2xl">🐾</span>
                                <div className="absolute -top-12 bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-lg">
                                    {userPoints} pts
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NODES - Aligned with cards */}
                    {rewards.map((reward, index) => {
                        const cost = reward.pointsCost;
                        const unlocked = userPoints >= cost;
                        // Position exactly over the card center using stride
                        const nodeLeftPosition = FIRST_CARD_CENTER + (index * STRIDE);

                        return (
                            <div
                                key={`node-${reward.id}`}
                                className="absolute top-[-14px] flex flex-col items-center z-20"
                                style={{ left: `${nodeLeftPosition}px`, transform: 'translateX(-50%)' }}
                            >
                                <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-xl shadow-lg transition-all duration-500 ${unlocked ? "bg-yellow-400 border-yellow-500 text-white scale-110" : "bg-white border-gray-300 text-gray-400"}`}>
                                    {/* Flag Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={unlocked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                        <line x1="4" x2="4" y1="22" y2="15" />
                                    </svg>
                                </div>
                                {/* Stick connecting to track */}
                                <div className={`w-1 h-7 transition-colors duration-500 ${unlocked ? "bg-yellow-500" : "bg-gray-300"}`}></div>
                            </div>
                        );
                    })}

                    {/* CARDS */}
                    {rewards.map((reward, index) => {
                        const cost = reward.pointsCost;
                        const unlocked = userPoints >= cost;
                        const isFree = reward.discountPercentage === 100;
                        const title = reward.serviceName + (isFree ? " (Grátis)" : ` (-${reward.discountPercentage}%)`);
                        const desc = isFree
                            ? "Serviço completo gratuito. Aproveite!"
                            : `Desconto de ${reward.discountPercentage}% neste serviço.`;

                        return (
                            <div key={reward.id} className="relative w-80 flex-shrink-0 flex flex-col scroll-snap-align-center" style={{ scrollSnapAlign: 'center' }}>
                                <div className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 ${unlocked
                                    ? "bg-white border-yellow-400 shadow-xl scale-[1.02] z-10"
                                    : "bg-white border-blue-200 shadow-md border-dashed" // Unified locked style
                                    }`}>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl shadow-inner ${unlocked ? "bg-yellow-100" : "bg-white"}`}>
                                            {getIcon(reward.serviceCategory)}
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${unlocked ? "bg-yellow-100 text-yellow-800" : "bg-slate-200 text-slate-500"}`}>
                                            {cost} pts
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight min-h-[3rem]">{title}</h3>
                                    <p className="text-sm text-slate-500 mb-6 min-h-[40px] leading-relaxed">{desc}</p>

                                    <button
                                        onClick={() => handleRedeem(reward.id, cost, title)}
                                        disabled={!unlocked || loadingId !== null}
                                        className={`w-full py-3 rounded-xl font-bold transition shadow-sm ${unlocked
                                            ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
        </div>
    );
}
