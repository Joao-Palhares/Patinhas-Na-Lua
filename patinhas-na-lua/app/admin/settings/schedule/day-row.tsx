"use client";

import { updateWorkingDay, checkScheduleConflicts } from "./actions";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    dayName: string;
    dayIndex: number;
    startTime: string;
    endTime: string;
    breakStartTime: string;
    breakEndTime: string;
    isClosed: boolean;
}

export default function DayRow({ dayName, dayIndex, startTime, endTime, breakStartTime, breakEndTime, isClosed }: Props) {
    const [closed, setClosed] = useState(isClosed);
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

    const handleSubmit = async (formData: FormData) => {
        const isClosing = formData.get("isClosed") === "on";

        if (isClosing) {
            const foundConflicts = await checkScheduleConflicts(dayIndex);
            if (foundConflicts.length > 0) {
                setConflicts(foundConflicts);
                setPendingFormData(formData);
                setIsWarningOpen(true);
                return;
            }
        }

        try {
            await updateWorkingDay(formData);
            toast.success("Horário atualizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao atualizar horário.");
        }
    };

    const confirmSave = async () => {
        if (pendingFormData) {
            try {
                await updateWorkingDay(pendingFormData);
                toast.success("Horário fechado com sucesso!");
            } catch (error) {
                toast.error("Erro ao fechar horário.");
            }
            setIsWarningOpen(false);
            setPendingFormData(null);
        }
    };

    return (
        <>
            <form action={handleSubmit} className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition group">
                <input type="hidden" name="dayOfWeek" value={dayIndex} />

                {/* 1. Day Name - Fixed Width */}
                <div className="w-32 font-bold text-gray-700 flex items-center gap-3 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full transition-colors ${closed ? "bg-red-400" : "bg-green-500"}`}></span>
                    {dayName}
                </div>

                {/* 2. Controls - Flexible but wrap if needed */}
                <div className="flex flex-wrap items-center gap-6 flex-1 min-w-[400px]">

                    {/* Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition shrink-0">
                        <input
                            type="checkbox"
                            name="isClosed"
                            checked={closed}
                            onChange={(e) => setClosed(e.target.checked)}
                            className="w-4 h-4 text-red-500 rounded focus:ring-red-500 border-gray-300"
                        />
                        <span className={`text-sm font-bold ${closed ? "text-red-600" : "text-gray-500"}`}>
                            {closed ? "Fechado" : "Aberto"}
                        </span>
                    </label>

                    {/* Time Inputs */}
                    <div className={`flex flex-wrap items-center gap-6 transition-all duration-300 ${closed ? "opacity-30 grayscale pointer-events-none" : "opacity-100"}`}>

                        {/* Morning Block */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manhã</span>
                            <input
                                name="startTime"
                                type="time"
                                defaultValue={startTime}
                                className="border border-gray-200 bg-gray-50 p-2 rounded-lg text-gray-800 font-bold font-mono text-sm focus:ring-2 focus:ring-blue-100 outline-none w-24 text-center shadow-sm"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input
                                name="breakStartTime"
                                type="time"
                                defaultValue={breakStartTime}
                                className="border border-gray-200 bg-gray-50 p-2 rounded-lg text-gray-800 font-bold font-mono text-sm focus:ring-2 focus:ring-blue-100 outline-none w-24 text-center shadow-sm"
                            />
                        </div>

                        {/* Afternoon Block */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarde</span>
                            <input
                                name="breakEndTime"
                                type="time"
                                defaultValue={breakEndTime}
                                className="border border-gray-200 bg-gray-50 p-2 rounded-lg text-gray-800 font-bold font-mono text-sm focus:ring-2 focus:ring-blue-100 outline-none w-24 text-center shadow-sm"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input
                                name="endTime"
                                type="time"
                                defaultValue={endTime}
                                className="border border-gray-200 bg-gray-50 p-2 rounded-lg text-gray-800 font-bold font-mono text-sm focus:ring-2 focus:ring-blue-100 outline-none w-24 text-center shadow-sm"
                            />
                        </div>

                    </div>

                </div>

                {/* 3. Button - Pushed right on large screens */}
                <div className="ml-auto">
                    <button className="bg-white border border-blue-200 text-blue-600 text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition shadow-sm uppercase tracking-wide">
                        Guardar
                    </button>
                </div>
            </form>

            {/* WARNING MODAL */}
            {isWarningOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border-l-4 border-yellow-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ Atenção: Existem Agendamentos!</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Ao fechar as <strong>{dayName}s</strong>, você entrará em conflito com os seguintes agendamentos futuros.
                            Terá de avisar os clientes manualmente.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto mb-6 border border-gray-200">
                            {conflicts.map((c) => (
                                <div key={c.id} className="flex justify-between items-center text-sm p-2 border-b last:border-0 border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-800">{new Date(c.date).toLocaleDateString()}</p>
                                        <p className="text-gray-500 text-xs">{c.clientName || c.clientEmail}</p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {c.serviceName}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsWarningOpen(false)}
                                className="flex-1 py-3 rounded-lg border font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmSave}
                                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md"
                            >
                                Confirmar Fecho
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
