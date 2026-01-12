'use client';

import { useState } from "react";
import { toast } from "sonner";

export default function SendRemindersButton() {
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        // We keep confirm as it's a critical action, but we could replace with a modal later
        if (!confirm("⚠️ Atenção: Isto vai enviar e-mails REAIS para todos os clientes com agendamento para AMANHÃ.\n\nTem a certeza?")) return;

        setLoading(true);
        try {
            const res = await fetch('/api/cron/reminders');
            const data = await res.json();
             toast.success("✅ Processo concluído!", {
                description: `Emails enviados: ${data.sent}`
            });
        } catch (error) {
             toast.error("❌ Erro ao enviar lembretes.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
            title="Enviar emails de lembrete para amanhã (Teste manual)"
        >
            {loading ? "A enviar..." : "📢 Lembretes (Manual)"}
        </button>
    );
}
