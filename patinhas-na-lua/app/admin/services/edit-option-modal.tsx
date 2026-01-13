"use client";
import { useState } from "react";
import { PetSize, CoatType } from "@prisma/client";
import { updateServiceOption } from "./actions";

interface Props {
  serviceCategory?: string;
  option: {
    id: string;
    petSize: PetSize | null;
    coatType: CoatType | null;
    price: any;
    durationMin: number;
    durationMax: number | null;
  };
}

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

export default function EditOptionModal({ option, serviceCategory }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-400 hover:text-blue-600 text-xs font-bold px-2"
      >
        ✏️
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Preço</h3>
            
            <form action={async (formData) => {
              await updateServiceOption(formData);
              setIsOpen(false);
            }} className="space-y-4">
              
              <input type="hidden" name="id" value={option.id} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tamanho</label>
                  <select name="size" defaultValue={option.petSize || "ALL"} className="w-full border p-2 rounded text-gray-900 bg-white">
                    <option value="ALL">Qualquer Tamanho</option>
                    {Object.entries(SIZE_LABELS).map(([key, label]) => {
                         if (serviceCategory === 'EXOTIC' && !['TOY', 'SMALL'].includes(key)) return null;
                         return <option key={key} value={key}>{label}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pelo</label>
                  <select name="coat" defaultValue={option.coatType || "ALL"} className="w-full border p-2 rounded text-gray-900 bg-white">
                    <option value="ALL">Qualquer pelo</option>
                    {Object.entries(COAT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mín (m)</label>
                  <input name="durationMin" type="number" defaultValue={option.durationMin} required className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Máx (m)</label>
                  <input name="durationMax" type="number" defaultValue={option.durationMax || ""} className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço (€)</label>
                  <input name="price" type="number" step="0.01" defaultValue={Number(option.price)} required className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 border py-2 rounded text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Guardar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}