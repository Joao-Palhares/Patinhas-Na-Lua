"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCouponAction } from "./actions";
import { Loader2 } from "lucide-react";

export default function DeleteCouponButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("Tem a certeza que deseja apagar este cupão?")) return;

        startTransition(async () => {
           try {
               await deleteCouponAction(id);
               toast.success("Cupão apagado com sucesso. 🗑️");
           } catch {
               toast.error("Erro ao apagar cupão.");
           }
        });
    };

    return (
        <button 
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition disabled:opacity-50" 
            title="Apagar"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "✕"}
        </button>
    );
}
