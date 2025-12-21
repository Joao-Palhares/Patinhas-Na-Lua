"use client";

import { useState } from "react";
import { createPetAction } from "./actions";

export default function AddPetModal({ userId, clientName }: { userId: string, clientName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* THE TRIGGER BUTTON (+) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-green-100 text-green-700 hover:bg-green-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition shadow-sm"
        title={`Adicionar pet para ${clientName}`}
      >
        +
      </button>

      {/* THE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Adicionar Pet <span className="text-sm font-normal text-gray-500">para {clientName}</span>
            </h3>

            <form 
              action={async (formData) => {
                await createPetAction(formData);
                setIsOpen(false); // Close modal on success
              }} 
              className="space-y-4"
            >
              <input type="hidden" name="userId" value={userId} />

              {/* Name & Species */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome *</label>
                  <input name="name" required className="w-full border p-2 rounded bg-gray-50 text-gray-900" placeholder="Ex: Bobby" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Espécie</label>
                  <select name="species" className="w-full border p-2 rounded bg-gray-50 text-gray-900">
                    <option value="DOG">Cão</option>
                    <option value="CAT">Gato</option>
                    <option value="RABBIT">Coelho</option>
                  </select>
                </div>
              </div>

              {/* Breed & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Raça</label>
                  <input name="breed" className="w-full border p-2 rounded bg-gray-50 text-gray-900" placeholder="Ex: Labrador" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sexo</label>
                  <select name="gender" className="w-full border p-2 rounded bg-gray-50 text-gray-900">
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
              </div>
              
              {/* Birthdate */}
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data Nascimento (Aprox)</label>
                  <input name="birthDate" type="date" className="w-full border p-2 rounded bg-gray-50 text-gray-900" />
                </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}