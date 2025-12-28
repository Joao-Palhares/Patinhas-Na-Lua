"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
// Corrected path: Go up 2 levels (to 'app') then down to dashboard/book
import { getAvailableSlots } from "../../dashboard/book/actions"; 

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Helpers to generate calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  const monthName = currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

  // Navigation
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  // --- FETCH REAL DATA FROM DB ---
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      setLoading(true);
      const promises = [];
      const dateKeys: string[] = [];

      // Loop through all days in the current view
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay();
        
        // Skip Weekends (Sat=6, Sun=0) and Past Dates to save DB calls
        const todayReset = new Date();
        todayReset.setHours(0, 0, 0, 0);
        
        // If it's past OR it's a weekend, skip fetching
        if (dateObj < todayReset || dayOfWeek === 0 || dayOfWeek === 6) {
          continue; 
        }

        // Format Date YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Add to fetch list
        // Note: We use 60 mins as a default duration to check "general availability"
        dateKeys.push(dateStr);
        promises.push(getAvailableSlots(dateStr, 60));
      }

      // Execute all requests in parallel
      try {
        const results = await Promise.all(promises);
        
        const newMap: Record<string, number> = {};
        results.forEach((slots, index) => {
          const dateKey = dateKeys[index];
          // We store the COUNT of available slots
          newMap[dateKey] = slots.length; 
        });

        setAvailabilityMap(newMap);
      } catch (error) {
        console.error("Failed to fetch availability", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthAvailability();
  }, [currentDate, year, month, daysInMonth]);


  // --- LOGIC FOR STATUS AND COLORS ---
  const getDayStatus = (day: number) => {
    const checkDate = new Date(year, month, day);
    const now = new Date();
    
    // Create Date String Key to look up in our Map
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Reset hours to compare just the day
    const todayReset = new Date(now); 
    todayReset.setHours(0,0,0,0);

    const isToday = checkDate.getTime() === todayReset.getTime();
    const isPast = checkDate < todayReset;
    const dayOfWeek = checkDate.getDay(); // 0 = Sun, 6 = Sat

    // 1. Gray Conditions (Past or Weekend)
    if (isPast) return { status: "disabled", color: "bg-gray-100 text-gray-300 border-gray-100", clickable: false };
    
    // Disable Sat(6) & Sun(0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { status: "weekend", color: "bg-gray-100 text-gray-400 border-gray-200", clickable: false };
    }

    // 2. Red Condition (Today > 18:00)
    if (isToday && now.getHours() >= 18) {
        return { status: "closed-time", color: "bg-red-50 text-red-400 border-red-200", clickable: false };
    }

    // 3. Loading State (show a pulse while fetching)
    if (loading && availabilityMap[dateStr] === undefined) {
       return { status: "loading", color: "bg-white text-gray-300 border-gray-100 animate-pulse", clickable: false };
    }

    // 4. Check Real Slots from Map
    const slotCount = availabilityMap[dateStr] ?? 0; // Default to 0 if not found

    if (slotCount === 0) {
        return { status: "full", color: "bg-red-50 text-red-500 border-red-200", clickable: false };
    }

    if (slotCount <= 3) {
        // Yellow (1-3 slots)
        return { status: "scarce", color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-400", clickable: true };
    }

    // Green (>3 slots)
    return { status: "available", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400", clickable: true };
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border-4 border-[#5A4633] p-6 shadow-xl rounded-xl">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} disabled={loading} className="text-2xl font-bold hover:bg-gray-100 w-10 h-10 rounded-full disabled:opacity-30">◀</button>
        <span className="font-serif font-bold uppercase tracking-widest text-xl text-[#5A4633]">{monthName}</span>
        <button onClick={() => changeMonth(1)} disabled={loading} className="text-2xl font-bold hover:bg-gray-100 w-10 h-10 rounded-full disabled:opacity-30">▶</button>
      </div>

      {/* Grid Headers */}
      <div className="grid grid-cols-7 text-center font-black text-gray-400 mb-2 text-sm uppercase">
        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty slots for start of month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}

        {/* Real Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { status, color, clickable } = getDayStatus(day);
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Layout for the day cell
          const DayContent = (
            <div className={`aspect-square border-2 flex flex-col items-center justify-center rounded-lg transition shadow-sm font-bold ${color} ${!clickable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className={status === "disabled" ? "line-through" : ""}>{day}</span>
              {status === "loading" && <span className="text-[10px] mt-1">...</span>}
            </div>
          );

          if (!clickable) {
            return <div key={day}>{DayContent}</div>;
          }

          return (
            <Link 
              href={`/dashboard/book?date=${dateStr}`} 
              key={day} 
              className="block"
            >
              {DayContent}
            </Link>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 justify-center text-xs font-bold uppercase tracking-wider text-gray-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-200 rounded-full"></div> Livre (+3)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-200 rounded-full"></div> Poucas Vagas</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-200 rounded-full"></div> Esgotado</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-full"></div> Fim de Semana / Passado</div>
      </div>
    </div>
  );
}