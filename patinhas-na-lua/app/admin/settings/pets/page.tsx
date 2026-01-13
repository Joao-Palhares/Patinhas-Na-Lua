import { db } from "@/lib/db";
import { PetSize } from "@prisma/client";
import { togglePetSizeRule } from "./actions";

export default async function PetsSettingsPage() {
    // Fetch existing rules using Raw SQL to bypass stale Client cache
    // This ensures it works efficiently even if 'prisma generate' hasn't run yet.
    const rulesRequest = await db.$queryRaw<any[]>`SELECT * FROM "PetSizeRule"`;
    
    // Normalize data (Prisma raw returns generic objects, we cast to expected shape)
    const rules = rulesRequest.map(r => ({
        size: r.size as PetSize,
        isActive: r.isActive
    }));

    // Helper to get state
    const isEnabled = (size: PetSize) => {
        const rule = rules.find(r => r.size === size);
        return rule ? rule.isActive : true; // Default to TRUE if no rule exists
    };

    // Dictionary for display
    const dogSizes: { size: PetSize; label: string; desc: string }[] = [
        { size: 'TOY', label: 'Toy (< 5kg)', desc: 'Chihuahua, Yorkshire...' },
        { size: 'SMALL', label: 'Pequeno (5-10kg)', desc: 'Pug, Shih Tzu...' },
        { size: 'MEDIUM', label: 'Médio (11-20kg)', desc: 'Beagle, Cocker...' },
        { size: 'LARGE', label: 'Grande (21-30kg)', desc: 'Labrador, Golden...' },
        { size: 'XL', label: 'XL (31-40kg)', desc: 'Pastor Alemão...' },
        { size: 'GIANT', label: 'Gigante (> 40kg)', desc: 'São Bernardo...' },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <a href="/admin/settings" className="text-gray-500 hover:text-gray-800 transition font-bold text-sm">← Voltar</a>
                <h1 className="text-3xl font-bold text-slate-800">Disponibilidade de Animais 🐾</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Cães</h2>
                    <p className="text-sm text-gray-500">
                        Desative categorias temporariamente em caso de avaria de equipamento ou falta de staff.
                    </p>
                </div>

                <div className="divide-y divide-gray-100">
                    {dogSizes.map((item) => {
                        const active = isEnabled(item.size);
                        return (
                            <div key={item.size} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                <div>
                                    <h3 className={`font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {item.label}
                                    </h3>
                                    <p className="text-xs text-gray-400">{item.desc}</p>
                                </div>
                                <form action={togglePetSizeRule}>
                                    <input type="hidden" name="size" value={item.size} />
                                    <input type="hidden" name="isActive" value={(!active).toString()} />
                                    <button 
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${active ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span 
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} 
                                        />
                                    </button>
                                </form>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hint for Cats */}
            <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm flex gap-2">
                <span>ℹ️</span>
                <p>
                    Para <strong>Gatos e Coelhos</strong>, a gestão é feita por categoria de serviço. 
                    Se necessário, desative os serviços da categoria "Exóticos" na página de Serviços.
                </p>
            </div>
        </div>
    );
}
