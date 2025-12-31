"use client";

import { useState } from "react";
import { sendTestEmailAction } from "../appointments/actions";

export default function TestEmailButton() {
    const [loading, setLoading] = useState(false);

    async function handleTest() {
        const email = prompt("Para qual email quer enviar o teste? (Deve ser o mesmo do registo no Resend se não tiver domínio verificado)");
        if (!email) return;

        setLoading(true);
        const res = await sendTestEmailAction(email);
        setLoading(false);

        if (res.success) {
            alert("✅ Email enviado! Verifique a sua caixa de entrada (e spam).");
        } else {
            alert("❌ Erro ao enviar. Verifique a consola do servidor.");
        }
    }

    return (
        <button
            onClick={handleTest}
            disabled={loading}
            className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
        >
            {loading ? "Enviando..." : "📧 Testar Email"}
        </button>
    );
}
