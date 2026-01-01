"use client";

import { useState } from "react";
import { addReward } from "./actions";

interface Service {
    id: string;
    name: string;
    category: string;
}

export default function AddRewardForm({ services }: { services: Service[] }) {
    const [value, setValue] = useState("");
    const [type, setType] = useState<"FREE" | "DISCOUNT">("FREE");
    const [discount, setDiscount] = useState(50);

    const formatCategory = (cat: string) => {
        if (cat === 'GROOMING') return 'Cão 🐶';
        if (cat === 'EXOTIC') return 'Gato/Coelho 🐱🐰';
        if (cat === 'SPA') return 'Spa 🛁';
        if (cat === 'HYGIENE') return 'Higiene 🧴';
        return cat;
    };

    const numValue = parseFloat(value) || 0;

    // Logic: 
    // Free Service (100% discount) -> Points based on Full Value (which is now the CAP)
    // Percentage Discount -> Points based on Savings
    const effectiveSavings = type === "FREE" ? numValue : (numValue * (discount / 100));
    const points = effectiveSavings > 0 ? Math.ceil(effectiveSavings * 20) : 0;

    return (
        <form action={addReward} className="space-y-4">

            {/* Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => setType("FREE")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${type === "FREE" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Oferta Completa (100%)
                </button>
                <button
                    type="button"
                    onClick={() => setType("DISCOUNT")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${type === "DISCOUNT" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Desconto (%)
                </button>
            </div>

            <input type="hidden" name="discountPercentage" value={type === "FREE" ? 100 : discount} />
            {type === "FREE" && <input type="hidden" name="maxDiscountAmount" value={value} />}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Serviço de Referência</label>
                <select name="serviceId" required className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900">
                    <option value="">Selecione um serviço...</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({formatCategory(s.category)})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        {type === "FREE" ? "Valor Máximo Coberto (€)" : "Valor Base para Cálculo (€)"}
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="ex: 30.00"
                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                    />
                    {type === "FREE" && (
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                            Define o teto máximo. Se o serviço custar mais (ex: cão gigante), o cliente paga a diferença.
                        </p>
                    )}
                </div>

                {type === "DISCOUNT" && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Percentagem (%)</label>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            required
                            value={discount}
                            onChange={e => setDiscount(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                        />
                    </div>
                )}
            </div>

            {/* Calculated Points Preview */}
            <div className={`p-4 rounded-lg border text-center transition ${points > 0 ? 'bg-purple-100 border-purple-200 text-purple-900' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                <p className="text-xs font-bold uppercase mb-1">Custo para o Cliente</p>
                <p className="text-2xl font-black">{points} Pontos</p>
                {points > 0 && <p className="text-xs mt-1">Oferta equivalente a {(effectiveSavings).toFixed(2)}€</p>}
            </div>

            <input type="hidden" name="pointsCost" value={points} />

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow transition transform hover:scale-[1.02]">
                Criar Prémio
            </button>
        </form>
    );
}
