"use client";

import { useState, useMemo } from "react";
import { addReward } from "./actions";

interface ServiceOption {
    id: string;
    price: number | string; // Decimal comes as string often
    petSize: string | null;
    coatType: string | null;
}

interface Service {
    id: string;
    name: string;
    category: string;
    options: ServiceOption[];
}

export default function AddRewardForm({ services }: { services: Service[] }) {
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [selectedOptionId, setSelectedOptionId] = useState("");
    
    // Value input (Price or Max Coverage)
    const [manualValue, setManualValue] = useState(""); 
    
    const [type, setType] = useState<"FREE" | "DISCOUNT">("FREE");
    const [discount, setDiscount] = useState(50);

    // Get currently selected service
    const selectedService = useMemo(() => 
        services.find(s => s.id === selectedServiceId), 
    [selectedServiceId, services]);

    // Get currently selected option
    const selectedOption = useMemo(() => 
        selectedService?.options.find(o => o.id === selectedOptionId), 
    [selectedService, selectedOptionId]);

    // Determine the effective "Value" to use for calculation
    // If Option selected -> Use its Price
    // If No Option -> Use Manual Value
    const activeValue = selectedOption ? Number(selectedOption.price) : (parseFloat(manualValue) || 0);

    const formatCategory = (cat: string) => {
        if (cat === 'GROOMING') return 'Cão 🐶';
        if (cat === 'EXOTIC') return 'Gato/Coelho 🐱🐰';
        if (cat === 'SPA') return 'Spa 🛁';
        if (cat === 'HYGIENE') return 'Higiene 🧴';
        return cat;
    };

    const formatOptionLabel = (opt: ServiceOption) => {
        const sizeMap: Record<string, string> = {
            'TOY': 'Toy (< 5kg)',
            'SMALL': 'Pequeno (5-10kg)',
            'MEDIUM': 'Médio (11-20kg)',
            'LARGE': 'Grande (21-30kg)',
            'XL': 'XL (31-40kg)',
            'GIANT': 'Gigante (> 40kg)'
        };
        
        const coatMap: Record<string, string> = {
            'SHORT': 'Pelo Curto',
            'MEDIUM': 'Pelo Médio',
            'LONG': 'Pelo Longo'
        };

        const size = opt.petSize ? (sizeMap[opt.petSize] || opt.petSize) : "Tamanho Único";
        const coat = opt.coatType ? ` - ${coatMap[opt.coatType] || opt.coatType}` : "";
        return `${size}${coat}`;
    };

    // Logic: 
    // Free Service (100% discount) -> Points based on Full Value
    // Percentage Discount -> Points based on Savings
    const effectiveSavings = type === "FREE" ? activeValue : (activeValue * (discount / 100));
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
            {type === "FREE" && <input type="hidden" name="maxDiscountAmount" value={activeValue} />}

            {/* SERVICE SELECT */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Serviço de Referência</label>
                <select 
                    name="serviceId" 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900"
                    value={selectedServiceId}
                    onChange={(e) => {
                        setSelectedServiceId(e.target.value);
                        setSelectedOptionId(""); // Reset option when service changes
                    }}
                >
                    <option value="">Selecione um serviço...</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({formatCategory(s.category)})
                        </option>
                    ))}
                </select>
            </div>

            {/* OPTION SELECT (Always Visible for better UX) */}
            <div className={`p-3 rounded-lg border transition-all duration-300 ${selectedService ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <label className={`block text-sm font-bold mb-1 ${selectedService ? 'text-purple-900' : 'text-gray-400'}`}>Opção Específica (Opcional)</label>
                
                {!selectedService ? (
                    <select disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-gray-400 cursor-not-allowed">
                        <option>← Selecione um serviço acima primeiro</option>
                    </select>
                ) : selectedService.options.length > 0 ? (
                    <>
                        <select 
                            name="serviceOptionId" 
                            className="w-full border border-purple-200 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition"
                            value={selectedOptionId}
                            onChange={(e) => setSelectedOptionId(e.target.value)}
                        >
                            <option value="">Qualquer Tamanho/Pelo (Genérico)</option>
                            {selectedService.options.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {formatOptionLabel(opt)} — {Number(opt.price).toFixed(2)}€
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-purple-700 mt-1">
                            * Ao selecionar uma opção, o valor e o custo em pontos são calculados automaticamente.
                        </p>
                    </>
                ) : (
                    <div className="p-2 bg-white/50 rounded border border-gray-200 text-sm italic text-gray-500">
                        Este serviço não tem variações (Preço único).
                    </div>
                )}
            </div>

            {/* VALUE / PRICE INPUT */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* DYNAMIC COST EXPLANATION (For Generic Rewards - Free OR Discount) */}
                {selectedService && !selectedOption ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-blue-100 p-1 rounded-md text-xs font-bold uppercase tracking-wider">Dinâmico</span>
                             <h3 className="font-bold text-sm">Custo em Pontos Automático</h3>
                        </div>
                        <p className="text-sm opacity-90 mb-3">
                            O custo deste prémio será calculado para cada cliente com base no tamanho do seu animal
                            {type === "DISCOUNT" ? ` e na poupança gerada (${discount}% do valor).` : "."}
                        </p>
                        
                        {/* Examples */}
                        {(() => {
                           const pct = type === "FREE" ? 1 : (discount / 100);
                           const exSmall = Math.ceil((20 * pct) * 20); // 20€ base
                           const exLarge = Math.ceil((30 * pct) * 20); // 30€ base
                           return (
                             <div className="flex gap-4 text-xs font-mono bg-white/60 p-2 rounded-lg">
                                <div>
                                    <span className="block text-blue-400 text-[10px] uppercase">Cão Pequeno (ex: 20€)</span>
                                    <span className="font-bold text-lg">{exSmall} pts</span>
                                    {type === "DISCOUNT" && <span className="block text-red-400 text-[9px]">-{(20 * pct).toFixed(2)}€</span>}
                                </div>
                                <div className="border-l border-blue-200 pl-4">
                                    <span className="block text-blue-400 text-[10px] uppercase">Cão Grande (ex: 30€)</span>
                                    <span className="font-bold text-lg">{exLarge} pts</span>
                                    {type === "DISCOUNT" && <span className="block text-red-400 text-[9px]">-{(30 * pct).toFixed(2)}€</span>}
                                </div>
                            </div>
                           );
                        })()}

                        {/* PERCENTAGE INPUT FOR DYNAMIC DISCOUNT */}
                        {type === "DISCOUNT" && (
                            <div className="mt-3">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Percentagem de Desconto (%)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    required
                                    value={discount}
                                    onChange={e => setDiscount(Number(e.target.value))}
                                    className="w-full border border-blue-200 rounded-lg p-2 text-gray-900 bg-white/80 focus:bg-white transition"
                                />
                            </div>
                        )}

                        {/* Send 0 to signal Dynamic Calc */}
                        <input type="hidden" name="pointsCost" value="0" />
                        <input type="hidden" name="maxDiscountAmount" value="0" />
                    </div>
                ) : (
                    // FIXED COST (If Option Selected OR Manual Value needed)
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {type === "FREE" ? "Valor Coberto (€)" : "Valor Base (€)"}
                            </label>
                            
                            {selectedOption ? (
                                // READ ONLY DISPLAY FOR OPTION - GREEN STYLE
                                <div className="w-full border border-green-200 bg-green-50 rounded-lg p-2 text-green-800 font-bold flex items-center justify-between shadow-sm">
                                    <span>{Number(selectedOption.price).toFixed(2)} €</span>
                                    <span className="text-[10px] uppercase tracking-wider bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Fixo</span>
                                </div>
                            ) : (
                                // MANUAL INPUT FOR GENERIC (Only if Manual Override needed, usually not for dynamic)
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    required={!selectedOption}
                                    value={manualValue}
                                    onChange={e => setManualValue(e.target.value)}
                                    placeholder="ex: 30.00"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                                />
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
                        
                        {/* Calculate Fixed Points */}
                        <input type="hidden" name="pointsCost" value={points} />
                    </div>
                )}
            </div>

            {/* POINTS PREVIEW (Hide if Dynamic) */}
            {!(selectedService && !selectedOption) && (
                <div className={`p-4 rounded-lg border text-center transition ${points > 0 ? 'bg-purple-100 border-purple-200 text-purple-900' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <p className="text-xs font-bold uppercase mb-1">Custo para o Cliente</p>
                    <p className="text-2xl font-black">{points} Pontos</p>
                    {points > 0 && <p className="text-xs mt-1">Oferta equivalente a {(effectiveSavings).toFixed(2)}€</p>}
                </div>
            )}

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow transition transform hover:scale-[1.02]">
                Criar Prémio
            </button>
        </form>
    );
}
