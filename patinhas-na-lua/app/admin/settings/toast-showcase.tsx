"use client";

import { toast } from "sonner";

export default function ToastShowcase() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        🎨 Testar Estilos de Notificação
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* SUCCESS */}
        <button
          type="button"
          onClick={() => toast.success("Sucesso!", { description: "As alterações foram guardadas." })}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:scale-105"
        >
          ✅ Sucesso
        </button>

        {/* INFO */}
        <button
          type="button"
          onClick={() => toast.info("Informação", { description: "Nova atualização disponível." })}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:scale-105"
        >
          ℹ️ Info
        </button>

        {/* WARNING */}
        <button
          type="button"
          onClick={() => toast.warning("Atenção", { description: "Verifique os dados antes de continuar." })}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:scale-105"
        >
          ⚠️ Aviso
        </button>

        {/* ERROR */}
        <button
          type="button"
          onClick={() => toast.error("Erro", { description: "Não foi possível conectar ao servidor." })}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:scale-105"
        >
          ❌ Erro
        </button>

      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Estas notificações aparecem no topo centro do ecrã.
      </p>
    </div>
  );
}
