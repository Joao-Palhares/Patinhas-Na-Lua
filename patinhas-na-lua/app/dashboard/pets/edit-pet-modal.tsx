"use client";

import { useState } from "react";
import { updatePetAction } from "@/app/admin/clients/actions";
import { PetSize, CoatType, Species } from "@prisma/client";
import { toast } from "sonner";

// Reusing the same labels for consistency
const SIZE_LABELS: Record<PetSize, string> = {
    TOY: "Toy (< 5kg)",
    SMALL: "Pequeno (5 - 10kg)",
    MEDIUM: "Médio (11 - 20kg)",
    LARGE: "Grande (21 - 30kg)",
    XL: "XL (31 - 40kg)",
    GIANT: "Gigante (> 40kg)",
};

const COAT_LABELS: Record<CoatType, string> = {
    SHORT: "Pelo Curto",
    MEDIUM: "Pelo Médio",
    LONG: "Pelo Comprido",
};

export default function EditPetModal({ pet }: { pet: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const res = await updatePetAction(formData);
        setLoading(false);

        if (res?.error) {
            toast.error("Erro ao atualizar pet.");
        } else {
            toast.success("Pet atualizado com sucesso!");
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs font-bold text-blue-500 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition ml-2"
            >
                Editar
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Editar {pet.name}</h2>

                        <form action={handleSubmit} className="space-y-4">
                            <input type="hidden" name="id" value={pet.id} />

                            {/* NAME */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                                <input
                                    name="name"
                                    defaultValue={pet.name}
                                    required
                                    className="w-full border border-gray-300 p-2 rounded-lg"
                                />
                            </div>

                            {/* SPECIES & GENDER */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Espécie</label>
                                    <select
                                        name="species"
                                        defaultValue={pet.species}
                                        className="w-full border border-gray-300 p-2 rounded-lg"
                                    >
                                        <option value="DOG">Cão</option>
                                        <option value="CAT">Gato</option>
                                        <option value="RABBIT">Coelho</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Sexo</label>
                                    <select
                                        name="gender"
                                        defaultValue={pet.gender}
                                        className="w-full border border-gray-300 p-2 rounded-lg"
                                    >
                                        <option value="Macho">Macho</option>
                                        <option value="Fêmea">Fêmea</option>
                                    </select>
                                </div>
                            </div>

                            {/* SIZE & COAT */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-3">
                                <p className="text-xs font-bold text-blue-600 uppercase">Informações Técnicas</p>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho</label>
                                    <select
                                        name="sizeCategory"
                                        defaultValue={pet.sizeCategory || ""}
                                        required
                                        className="w-full border border-blue-200 p-2 rounded-lg bg-white"
                                    >
                                        {Object.entries(SIZE_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Pelo</label>
                                    <select
                                        name="coatType"
                                        defaultValue={pet.coatType || ""}
                                        required
                                        className="w-full border border-blue-200 p-2 rounded-lg bg-white"
                                    >
                                        {Object.entries(COAT_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* BREED */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Raça</label>
                                <input
                                    name="breed"
                                    defaultValue={pet.breed || ""}
                                    className="w-full border border-gray-300 p-2 rounded-lg"
                                />
                            </div>

                            {/* BIRTHDATE */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Data Nascimento</label>
                                <input
                                    name="birthDate"
                                    type="date"
                                    defaultValue={pet.birthDate ? new Date(pet.birthDate).toISOString().split('T')[0] : ""}
                                    className="w-full border border-gray-300 p-2 rounded-lg"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    {loading ? "A guardar..." : "Guardar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
