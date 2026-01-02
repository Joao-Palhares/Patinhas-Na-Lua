"use client";

import { useState } from "react";
import { updateUserProfile } from "@/app/dashboard/profile/actions";
import { User } from "@prisma/client";

interface CustomProfileFormProps {
  initialData: User;
}

export default function CustomProfileForm({ initialData }: CustomProfileFormProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(formData);
      setMessage({ type: "success", text: "Dados atualizados com sucesso!" });
    } catch (e) {
      setMessage({ type: "error", text: "Erro ao atualizar dados." });
    }

    setIsLoading(false);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Meus Dados</h2>
      <p className="text-sm text-gray-500 mb-6">
        Estes dados são utilizados para a emissão de faturas e contacto.
      </p>

      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input
            name="name"
            defaultValue={initialData.name || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Telemóvel</label>
            <input
              name="phone"
              defaultValue={initialData.phone || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">NIF</label>
            <input
              name="nif"
              defaultValue={initialData.nif || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Morada</label>
          <textarea
            name="address"
            rows={3}
            defaultValue={initialData.address || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
