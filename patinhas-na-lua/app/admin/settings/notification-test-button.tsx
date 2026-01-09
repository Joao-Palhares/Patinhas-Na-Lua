"use client";

import { useState } from "react";

export default function NotificationTestButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    async function trigger() {
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch("/api/cron/reminders");
            const data = await res.json();
            if (data.success) {
                setStatus(`Enviado: ${data.sent} / Scan: ${data.scanned}`);
            } else {
                setStatus(data.message || "Erro");
            }
        } catch (e) {
            setStatus("Falha na chamada API");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-end">
            <button 
                type="button" // Important to not submit the main form
                onClick={trigger}
                disabled={loading}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition active:scale-95 disabled:opacity-50"
            >
                {loading ? "A enviar..." : "Enviar Agora 🚀"}
            </button>
            {status && <span className="text-xs font-mono text-blue-800 mt-1">{status}</span>}
        </div>
    );
}
