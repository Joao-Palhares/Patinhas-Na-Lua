"use client";

import { useState } from "react";
import { registerPayment } from "./actions";
import { PaymentMethod } from "@prisma/client";

interface Props {
  id: string;
  currentPrice: number;
}

export default function PaymentModal({ id, currentPrice }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-200 hover:bg-yellow-100 transition"
      >
        <span className="text-lg">💶</span>
        <span className="text-xs font-bold text-yellow-700">Registar Pagamento</span>
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registar Pagamento</h3>

            <form action={async (formData) => {
              await registerPayment(formData);
              setIsOpen(false);
            }} className="space-y-4">
              
              <input type="hidden" name="id" value={id} />

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Valor Recebido (€)</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  defaultValue={currentPrice} // Default to the booked price
                  className="w-full border-2 border-gray-300 p-2 rounded-lg text-lg font-bold text-gray-900" 
                />
                <p className="text-xs text-gray-400 mt-1">Altere se o cliente deu gorjeta ou valor extra.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Método</label>
                <select name="method" className="w-full border border-gray-300 p-2 rounded-lg text-gray-900 bg-white">
                  <option value="CASH">Dinheiro 💵</option>
                  <option value="MBWAY">MBWay 📱</option>
                  <option value="CARD">Multibanco 💳</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}