"use client";

import { useState } from "react";
import { createCouponAction } from "./actions";
import { toast } from "sonner";

interface User {
    id: string;
    name: string | null;
    email: string;
}

export default function CreateCouponModal({ users }: { users: User[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const res = await createCouponAction(formData);
        setLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Cupão criado com sucesso!");
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
                <span>+</span> Criar Cupão
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Novo Cupão</h2>

                        <form action={handleSubmit} className="space-y-4">

                            {/* CODE */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Código Promocional</label>
                                <input
                                    name="code"
                                    required
                                    placeholder="EX: VERÃO2025"
                                    className="w-full border border-gray-300 p-2 rounded-lg uppercase font-mono tracking-wide focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* DISCOUNT */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Desconto (%)</label>
                                <input
                                    name="discount"
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    defaultValue="10"
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* MAX USES */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Limite de Utilizações</label>
                                <input
                                    name="maxUses"
                                    type="number"
                                    required
                                    min="1"
                                    defaultValue="1"
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Ex: 1 (Para cliente único) ou 50 (Para campanha "Verão").</p>
                            </div>

                            {/* USER (OPTIONAL) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Atribuir a Cliente (Opcional)</label>
                                <select
                                    name="userId"
                                    className="w-full border border-gray-300 p-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">-- Cupão Geral (Qualquer pessoa) --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Se selecionar um cliente, apenas ele poderá usar este código.</p>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    {loading ? "A criar..." : "Criar Cupão"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
