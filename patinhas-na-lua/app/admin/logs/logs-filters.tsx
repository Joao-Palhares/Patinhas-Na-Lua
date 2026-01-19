"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce"; 

export default function LogsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [action, setAction] = useState(searchParams.get("action") || "");
  const [entity, setEntity] = useState(searchParams.get("entity") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  
  // Date Logic
  const [dateRange, setDateRange] = useState(searchParams.get("range") || "all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [debouncedSearch] = useDebounce(search, 500);

  // Apply filters effect
  useEffect(() => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (debouncedSearch) params.set("search", debouncedSearch);
    
    if (dateRange !== 'custom') {
        if (dateRange !== 'all') params.set("range", dateRange);
    } else {
        if (customStart) params.set("startDate", customStart);
        if (customEnd) params.set("endDate", customEnd);
        params.set("range", "custom");
    }

    router.push(`/admin/logs?${params.toString()}`);
  }, [action, entity, debouncedSearch, dateRange, customStart, customEnd, router]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
      
      <div className="flex flex-wrap gap-4">
        {/* ACTION SELECT */}
        <select 
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border p-2 rounded text-sm bg-slate-50 font-bold text-slate-700"
        >
            <option value="">Todas as Ações</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
        </select>

        {/* ENTITY SELECT */}
        <select 
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="border p-2 rounded text-sm bg-slate-50 font-bold text-slate-700"
        >
            <option value="">Todas as Entidades</option>
            <option value="Appointment">Agendamento</option>
            <option value="User">Cliente / User</option>
            <option value="Pet">Animal</option>
            <option value="Settings">Configurações</option>
        </select>

         {/* SEARCH */}
         <input 
            placeholder="🔍 Pesquisar em detalhes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded text-sm bg-slate-50 flex-1 min-w-[200px]"
         />
      </div>

      <div className="border-t pt-4 flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold text-gray-500 uppercase">Período:</span>
          
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
              {['all', 'today', '24h', '7d', '30d'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-3 py-1 rounded text-xs font-bold transition
                        ${dateRange === r ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    {r === 'all' ? 'Tudo' : r === 'today' ? 'Hoje' : r === '24h' ? '24h' : r === '7d' ? '7 Dias' : '30 Dias'}
                  </button>
              ))}
               <button
                    onClick={() => setDateRange("custom")}
                    className={`px-3 py-1 rounded text-xs font-bold transition
                        ${dateRange === 'custom' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    Custom
                  </button>
          </div>

          {dateRange === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <input type="date" className="border p-1 rounded text-xs" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                  <span className="text-gray-400">-</span>
                  <input type="date" className="border p-1 rounded text-xs" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
          )}

          <button 
            onClick={() => { setAction(""); setEntity(""); setSearch(""); setDateRange("all"); }}
            className="ml-auto text-xs text-red-500 hover:underline"
          >
            Limpar Filtros
          </button>
      </div>

    </div>
  );
}
