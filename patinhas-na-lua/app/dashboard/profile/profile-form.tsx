"use client";

import { useActionState, useState, useEffect } from "react";
import { updateUserAction, requestAccountDeletion } from "@/app/actions";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner"; // + Import

export default function ProfileForm({ initialData }: { initialData: any }) {
  const { user } = useUser(); 
  const [state, formAction, isPending] = useActionState(updateUserAction, null);
  
  const [deleteState, deleteAction, isDeletePending] = useActionState(requestAccountDeletion, null);

  // Effect to show toast based on Server Action result
  useEffect(() => {
      if (state?.success) {
          toast.success(state.success);
      } else if (state?.error) {
          toast.error(state.error);
      }
  }, [state]);

  // Effect for delete action
  useEffect(() => {
    if (deleteState?.success) {
        toast.success("Pedido enviado com sucesso.", { description: "Os seus dados serão eliminados em 30 dias." });
    }
  }, [deleteState]);


  if (!initialData) return <div className="p-8 text-center text-red-500">Erro ao carregar perfil.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-xl mx-auto px-4 mt-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
                <button className="text-gray-500 hover:text-gray-900 font-bold">← Voltar</button>
            </Link>
            <h1 className="text-2xl font-black text-gray-800">Meu Perfil 👤</h1>
        </div>

        {/* Removed inline messages, now handled by toast */}

        {/* PROFILE PICTURE (From Clerk) */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-2">
                <Image 
                    src={user?.imageUrl || "/placeholder-user.png"} // fallback
                    alt="Profile" 
                    fill 
                    className="object-cover"
                />
            </div>
            <p className="text-sm text-gray-500">Foto gerida pela sua conta Google/Email</p>
        </div>

        {/* FORM */}
        <form action={formAction} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            {/* NAME */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <input 
                    name="name" 
                    defaultValue={initialData.name || ""} 
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                />
            </div>

            {/* PHONE */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telemóvel</label>
                <input 
                    name="phone" 
                    type="tel"
                    defaultValue={initialData.phone || ""}
                    placeholder="Digite o telemóvel..." 
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                />
            </div>

            {/* NIF */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">NIF (Para Fatura)</label>
                <input 
                    name="nif" 
                    type="number"
                    defaultValue={initialData.nif || ""}
                    placeholder="Digite o NIF..."
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                />
            </div>

            {/* ADDRESS */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Morada</label>
                <textarea 
                    name="address" 
                    defaultValue={initialData.address || ""}
                    placeholder="Rua..."
                    className="w-full p-4 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium h-24 resize-none"
                />
            </div>

            <button 
                disabled={isPending}
                className="w-full bg-slate-900 text-white font-bold h-14 rounded-xl shadow-lg hover:bg-black transition disabled:opacity-50"
            >
                {isPending ? "A Guardar..." : "Guardar Alterações"}
            </button>

        </form>

        {/* DANGER ZONE (GDPR) */}
        <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-bold text-red-600 uppercase mb-4">Zona de Perigo</h3>
            
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-800 mb-2">Eliminar Conta</h4>
                <p className="text-sm text-red-600/80 mb-4">
                    Ao solicitar a eliminação, todos os seus dados (incluindo histórico de pets) serão removidos permanentemente após 30 dias.
                </p>
                
                {deleteState?.success ? (
                    <div className="bg-white p-3 rounded text-green-700 font-bold text-sm text-center">
                        Pedido Enviado. ✅
                    </div>
                ) : (
                    <form action={deleteAction}>
                        <button 
                            disabled={isDeletePending}
                            className="text-xs bg-white text-red-600 border border-red-200 font-bold py-2 px-4 rounded hover:bg-red-100 transition"
                        >
                            {isDeletePending ? "A processar..." : "Solicitar Eliminação dos Dados"}
                        </button>
                    </form>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}
