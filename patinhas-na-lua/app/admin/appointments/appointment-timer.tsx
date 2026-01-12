"use client";

import { startAppointment, finishAppointment } from "./actions";
import { useState, useEffect } from "react";

interface Props {
  appointment: {
    id: string;
    actualStartTime: Date | null;
    finishedAt: Date | null;
    service: {
      isTimeBased?: boolean; // Can be undefined if old data, assume false
    };
  };
}

export default function AppointmentTimer({ appointment }: Props) {
  // Use local state to update UI immediately (optimistic-like) or just rely on server revalidate
  // Server revalidate is safer.
  
  // Cast for safety if needed
  const isTimeBased = (appointment.service as any).isTimeBased;

  if (!isTimeBased) return null;

  const startTime = appointment.actualStartTime ? new Date(appointment.actualStartTime) : null;
  const endTime = appointment.finishedAt ? new Date(appointment.finishedAt) : null;

  // Calculate elapsed time for display
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startTime && !endTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60); // minutes
        setElapsed(diff);
      }, 1000 * 60); // Update every minute
      
      // Initial set
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
      setElapsed(diff);

      return () => clearInterval(interval);
    } else if (startTime && endTime) {
       const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
       setElapsed(diff);
    }
  }, [startTime, endTime]);

  if (!startTime) {
    return (
      <form action={startAppointment}>
        <input type="hidden" name="id" value={appointment.id} />
        <button className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
          ▶ Iniciar
        </button>
      </form>
    );
  }

  if (!endTime) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-blue-600 animate-pulse">
          ⏱ {elapsed} min
        </span>
        <form action={finishAppointment}>
            <input type="hidden" name="id" value={appointment.id} />
            <button className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
            ⏹ Parar
            </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 cursor-default">
      ✅ {elapsed} min
    </div>
  );
}
