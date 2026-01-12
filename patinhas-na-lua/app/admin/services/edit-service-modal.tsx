"use client";

import { useState } from "react";
import { ServiceCategory } from "@prisma/client";
import { updateService } from "./actions";

interface Props {
  service: {
    id: string;
    name: string;
    description: string | null;
    category: ServiceCategory;
    isMobileAvailable?: boolean;
    isTimeBased?: boolean;
  };
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  GROOMING: "Banhos e Tosquias",
  HYGIENE: "Higiene (Unhas/Ouvidos)",
  EXOTIC: "Exóticos (Gatos/Coelhos)",
  SPA: "Spa e Tratamentos",
};

export default function EditServiceModal({ service }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2"
      >
        ✏️ Editar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Serviço</h3>

            <form action={async (formData) => {
              await updateService(formData);
              setIsOpen(false);
            }} className="space-y-4">

              <input type="hidden" name="id" value={service.id} />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome</label>
                <input
                  name="name"
                  defaultValue={service.name}
                  required
                  className="w-full border p-2 rounded text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                <select
                  name="category"
                  defaultValue={service.category}
                  className="w-full border p-2 rounded text-gray-900 bg-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <textarea
                  name="description"
                  defaultValue={service.description || ""}
                  rows={3}
                  className="w-full border p-2 rounded text-gray-900 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
                <input
                  type="checkbox"
                  name="isMobileAvailable"
                  id="mobileCheck"
                  defaultChecked={service.isMobileAvailable ?? true}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="mobileCheck" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Disponível ao Domicílio? 🚐
                </label>
              </div>

              <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                <input
                  type="checkbox"
                  name="isTimeBased"
                  id="timeCheckEdit"
                  defaultChecked={service.isTimeBased ?? false}
                  className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 border-yellow-300"
                />
                <label htmlFor="timeCheckEdit" className="text-sm font-bold text-yellow-700 cursor-pointer">
                  Preço ao Tempo (Hora) ⏳
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 border py-2 rounded text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}