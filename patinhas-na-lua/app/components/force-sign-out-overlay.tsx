"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

export default function ForceSignOutOverlay({ reason }: { reason: string }) {
  const { signOut } = useClerk();

  // Auto-signout effect (optional, or just manual)
  // useEffect(() => { signOut(); }, []); 

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center border-t-4 border-red-500">
        <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Bloqueado</h1>
        <p className="text-gray-500 mb-8 font-medium">
          {reason === "Account Deactivated" ? "A sua conta foi desativada ou removida." : 
           reason === "Account Not Found" ? "Erro de integridade: Conta não encontrada." :
           "Acesso suspenso."}
        </p>

        <button 
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Terminar Sessão
        </button>
        
        <p className="mt-6 text-xs text-gray-400">
          Se acredita que isto é um erro, por favor contacte a equipa de suporte.
        </p>
      </div>
    </div>
  );
}
