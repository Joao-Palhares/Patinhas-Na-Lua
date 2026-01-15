"use client";

import { useState } from "react";
import { createOfflineClientAction } from "./actions";
import { toast } from "sonner";

export default function RegisterClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await createOfflineClientAction(formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente criado com sucesso!");
      setIsOpen(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-md flex items-center gap-2"
      >
        <span>+</span> Criar Novo Cliente
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Registar Novo Cliente
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Use esta opção para clientes que não usam internet (via telefone/presencial).
            </p>

            <form action={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  name="name" 
                  required 
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: Maria dos Santos" 
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telemóvel *</label>
                <input 
                  name="phone" 
                  required 
                  type="tel"
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: 912345678" 
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email (Opcional)
                    <span className="text-gray-400 font-normal ml-1">- Se vazio, será gerado um email fictício.</span>
                </label>
                <input 
                  name="email" 
                  type="email"
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: maria@email.com" 
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas Internas</label>
                <textarea 
                  name="notes" 
                  rows={3}
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: Cliente idosa, prefere ser contactada de manhã." 
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 font-bold"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 disabled:opacity-70"
                >
                  {loading ? "A Criar..." : "Registar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
