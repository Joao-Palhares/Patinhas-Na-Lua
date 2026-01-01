"use client";

import { useState } from "react";

interface Appointment {
    id: string;
    date: Date;
    pet: { name: string };
    service: { name: string };
    user: { name: string | null };
}

export default function AdminNotifications({ appointments }: { appointments: Appointment[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const count = appointments.length;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white group"
            >
                <span>🔔</span>
                <span className="flex-1 text-left group-hover:text-white">Notificações</span>
                {count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                        {count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                            🔔 Amanhã <span className="text-sm font-normal text-gray-500">({count} marcações)</span>
                        </h3>

                        <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                            {appointments.length === 0 ? (
                                <p className="text-gray-500 italic text-center py-8">Sem agendamentos para amanhã. 😴</p>
                            ) : (
                                appointments.map(app => (
                                    <div key={app.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg hover:bg-blue-100 transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{app.pet.name} 🐾</p>
                                                <p className="text-xs text-gray-500 mb-1">Dono: {app.user.name}</p>
                                                <p className="text-sm text-blue-700 font-medium">{app.service.name}</p>
                                            </div>
                                            <span className="font-mono font-bold text-lg text-blue-800 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                                                {new Date(app.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-2 border-t text-center">
                            <button onClick={() => setIsOpen(false)} className="text-sm text-gray-500 hover:text-gray-800">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
