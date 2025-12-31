"use client";

import { useState } from "react";

interface WhatsAppModalProps {
    phone: string;
    clientName: string;
    petName: string;
    date: Date;
    serviceName: string;
}

export default function WhatsAppModal({ phone, clientName, petName, date, serviceName }: WhatsAppModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Format Date
    const dateStr = date.toLocaleDateString("pt-PT");
    const timeStr = date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

    // Construct Message
    const message = `Olá ${clientName}! 🐾\nLembramos que o ${petName} tem agendamento na Patinhas na Lua para ${serviceName} no dia ${dateStr} às ${timeStr}.\nAté já!`;

    // Encode for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    // QR Code Image URL (using goqr.me API for simplicity, no key needed)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappUrl)}`;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition"
                title="Enviar WhatsApp (QR Code)"
            >
                <span className="text-xl">📱</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full relative animate-in fade-in zoom-in duration-200">

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Enviar Lembrete</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Escaneie com o seu telemóvel para enviar sem login no PC.
                    </p>

                    {/* QR Code */}
                    <div className="bg-white p-2 border-2 border-gray-100 rounded-lg inline-block mb-4">
                        <img src={qrCodeUrl} alt="Scan to WhatsApp" width={200} height={200} />
                    </div>

                    {/* Message Preview */}
                    <div className="bg-gray-50 p-3 rounded-lg text-left mb-4">
                        <p className="text-xs text-gray-500 font-bold mb-1">Mensagem:</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap italic">"{message}"</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Abrir no PC
                        </a>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(whatsappUrl);
                                alert("Link copiado!");
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                            title="Copiar Link"
                        >
                            📋
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
