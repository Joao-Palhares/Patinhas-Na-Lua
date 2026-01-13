import { db } from "@/lib/db";
import { PetSize } from "@prisma/client";
import { togglePetSizeRule } from "./actions";

export default async function PetsSettingsPage() {
    // Fetch rules including species
    const rulesRequest = await db.$queryRaw<any[]>`SELECT * FROM "PetSizeRule"`;
    
    const rules = rulesRequest.map(r => ({
        size: r.size as PetSize,
        species: r.species as string, // 'DOG', 'CAT', etc.
        isActive: r.isActive
    }));

    // Helper
    const isEnabled = (size: PetSize, species: string) => {
        // Defaults: DOG if not found
        const rule = rules.find(r => r.size === size && r.species === species);
        return rule ? rule.isActive : true;
    };

    const dogSizes: { size: PetSize; label: string; desc: string }[] = [
        { size: 'TOY', label: 'Toy (< 5kg)', desc: 'Chihuahua, Yorkshire...' },
        { size: 'SMALL', label: 'Pequeno (5-10kg)', desc: 'Pug, Shih Tzu...' },
        { size: 'MEDIUM', label: 'Médio (11-20kg)', desc: 'Beagle, Cocker...' },
        { size: 'LARGE', label: 'Grande (21-30kg)', desc: 'Labrador, Golden...' },
        { size: 'XL', label: 'XL (31-40kg)', desc: 'Pastor Alemão...' },
        { size: 'GIANT', label: 'Gigante (> 40kg)', desc: 'São Bernardo...' },
    ];

    // Assuming Cats/Rabbits map to TOY or SMALL
    const exoticSizes: { size: PetSize; label: string; desc: string }[] = [
        { size: 'TOY', label: 'Minis (< 5kg)', desc: 'Coelhos, Gatos Pequenos...' },
        { size: 'SMALL', label: 'Pequenos (5-10kg)', desc: 'Gatos Grandes, Coelhos Gigantes...' },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <a href="/admin/settings" className="text-gray-500 hover:text-gray-800 transition font-bold text-sm">← Voltar</a>
                <h1 className="text-3xl font-bold text-slate-800">Disponibilidade de Animais 🐾</h1>
            </div>

            <div className="space-y-8">
                {/* DOGS SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800">Cães 🐶</h2>
                        <p className="text-sm text-gray-500">
                            Gestão de disponibilidade por tamanho de cão.
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {dogSizes.map((item) => {
                            const active = isEnabled(item.size, 'DOG');
                            return (
                                <div key={item.size} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div>
                                        <h3 className={`font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</h3>
                                        <p className="text-xs text-gray-400">{item.desc}</p>
                                    </div>
                                    <form action={togglePetSizeRule}>
                                        <input type="hidden" name="size" value={item.size} />
                                        <input type="hidden" name="species" value="DOG" />
                                        <input type="hidden" name="isActive" value={(!active).toString()} />
                                        <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-purple-600' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </form>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CATS/RABBITS SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800">Gatos e Coelhos 🐱🐰</h2>
                         <p className="text-sm text-gray-500">
                            Gestão específica para animais exóticos/pequenos.
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {exoticSizes.map((item) => {
                             // We check CAT status. If Rabbit logic is identical, we assume they share this toggle.
                             // Or we can create separate toggles for CAT and RABBIT?
                             // User asked for "cat/rabits". I'll use 'CAT' as the primary key for the rule, and apply to Rabbit too logic-side.
                             // Or maybe I save one rule for 'CAT' and one for 'RABBIT' in a single click? No.
                             // I'll assume 'CAT' rule covers 'RABBIT' in my logic check later. Or just save 'CAT'.
                             const active = isEnabled(item.size, 'CAT'); 
                             return (
                                <div key={item.size + '_cat'} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div>
                                        <h3 className={`font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</h3>
                                        <p className="text-xs text-gray-400">{item.desc}</p>
                                    </div>
                                    <form action={togglePetSizeRule}>
                                        <input type="hidden" name="size" value={item.size} />
                                        <input type="hidden" name="species" value="CAT" /> 
                                        <input type="hidden" name="isActive" value={(!active).toString()} />
                                        <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </form>
                                </div>
                             );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
