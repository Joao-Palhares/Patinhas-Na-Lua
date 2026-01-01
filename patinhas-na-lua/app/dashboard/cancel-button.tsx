"use client";

import { cancelAppointment } from "./actions";
import { useTransition } from "react";

export default function CancelButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        if (!confirm("Tem a certeza que deseja cancelar este agendamento?")) return;
        startTransition(async () => {
            await cancelAppointment(id);
        });
    }

    return (
        <button
            onClick={handleCancel}
            disabled={isPending}
            className="text-red-400 hover:text-red-700 font-bold text-xs border border-red-200 hover:border-red-400 rounded px-2 py-1 transition disabled:opacity-50 ml-auto"
            title="Cancelar Agendamento"
        >
            {isPending ? "..." : "Cancelar"}
        </button>
    );
}
