"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAvailableSlots, getMonthAvailability } from "../../dashboard/book/actions";
import { SignInButton, SignUpButton } from "@clerk/nextjs"; // <--- IMPORT THIS

interface Props {
  isLoggedIn: boolean;
  closedDays?: number[];
  absenceRanges?: { from: Date; to: Date }[];
}

export default function BookingCalendar({ isLoggedIn, closedDays, absenceRanges }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const activeClosedDays = closedDays || [0, 6];

  // --- (Keep your existing Helpers & useEffect logic exactly the same) ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  useEffect(() => {
    const fetchMonthAvailability = async () => {
      setLoading(true);
      try {
        const data = await getMonthAvailability(year, month);
        setAvailabilityMap(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthAvailability();
  }, [currentDate, year, month]); // Removing derived props from dependency array to reduce re-renders if passing new refs

  const getDayStatus = (day: number) => {
    const checkDate = new Date(year, month, day);
    const now = new Date();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayReset = new Date(now);
    todayReset.setHours(0, 0, 0, 0);
    const isToday = checkDate.getTime() === todayReset.getTime();
    const isPast = checkDate < todayReset;
    const dayOfWeek = checkDate.getDay();

    // Dynamic Checks
    const isClosed = activeClosedDays.includes(dayOfWeek);
    const isAbsent = absenceRanges?.some(range => checkDate >= range.from && checkDate <= range.to);

    if (isPast) return { status: "disabled", color: "bg-gray-100 text-gray-300 border-gray-100", clickable: false };
    if (isClosed || isAbsent) return { status: "weekend", color: "bg-gray-100 text-gray-400 border-gray-200", clickable: false };
    if (isToday && now.getHours() >= 18) return { status: "closed-time", color: "bg-red-50 text-red-400 border-red-200", clickable: false };
    if (loading && availabilityMap[dateStr] === undefined) return { status: "loading", color: "bg-white text-gray-300 border-gray-100 animate-pulse", clickable: false };

    const slotCount = availabilityMap[dateStr] ?? 0;
    if (slotCount === 0) return { status: "full", color: "bg-red-50 text-red-500 border-red-200", clickable: false };
    if (slotCount <= 3) return { status: "scarce", color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-400", clickable: true };
    return { status: "available", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400", clickable: true };
  };

  const handleDayClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <>
      {/* --- CALENDAR UI (Same as before) --- */}
      <div className="w-full max-w-3xl mx-auto bg-white border border-gray-100 p-6 shadow-xl rounded-xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => changeMonth(-1)} disabled={loading} className="text-2xl font-bold hover:bg-gray-100 w-10 h-10 rounded-full disabled:opacity-30">◀</button>
          <span className="font-serif font-bold uppercase tracking-widest text-xl text-gray-800">{monthName}</span>
          <button onClick={() => changeMonth(1)} disabled={loading} className="text-2xl font-bold hover:bg-gray-100 w-10 h-10 rounded-full disabled:opacity-30">▶</button>
        </div>
        <div className="grid grid-cols-7 text-center font-black text-gray-400 mb-2 text-sm uppercase">
          <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { status, color, clickable } = getDayStatus(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const DayContent = (
              <div className={`aspect-square border-2 flex flex-col items-center justify-center rounded-lg transition shadow-sm font-bold ${color} ${!clickable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className={status === "disabled" ? "line-through" : ""}>{day}</span>
                {status === "loading" && <span className="text-[10px] mt-1">...</span>}
              </div>
            );
            if (!clickable) return <div key={day}>{DayContent}</div>;
            return (
              <Link href={`/dashboard/book?date=${dateStr}`} key={day} className="block" onClick={handleDayClick}>
                {DayContent}
              </Link>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 justify-center text-xs font-bold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-200 rounded-full"></div> Livre (+3)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-200 rounded-full"></div> Poucas Vagas</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-200 rounded-full"></div> Esgotado</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-full"></div> Fim de Semana</div>
        </div>
      </div>

      {/* --- CLERK INTEGRATED MODAL --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-200">

            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="text-4xl mb-4 block">👋</span>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Quase lá!</h3>
            <p className="text-gray-500 mb-8">
              Para garantir a segurança do seu agendamento, precisamos que faça login ou crie uma conta rápida.
            </p>

            <div className="space-y-3">
              {/* CLERK SIGN UP BUTTON (Opens Modal) */}
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard/book">
                <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                  Criar Conta Nova
                </button>
              </SignUpButton>

              {/* CLERK SIGN IN BUTTON (Opens Modal) */}
              <SignInButton mode="modal" forceRedirectUrl="/dashboard/book">
                <button className="w-full bg-white text-gray-700 border border-gray-200 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition">
                  Já tenho conta (Entrar)
                </button>
              </SignInButton>
            </div>

          </div>
        </div>
      )}
    </>
  );
}