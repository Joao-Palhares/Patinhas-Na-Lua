"use client";

import { useState, useMemo } from "react";
import { Service, ServiceOption, PetSize, CoatType, ServiceCategory } from "@prisma/client";

const SIZES: PetSize[] = ["TOY", "SMALL", "MEDIUM", "LARGE", "XL", "GIANT"];
const COATS: CoatType[] = ["SHORT", "MEDIUM", "LONG"];

const SIZE_LABELS: Record<PetSize, string> = {
  TOY: "< 5kg",
  SMALL: "5-10kg",
  MEDIUM: "11-20kg",
  LARGE: "21-30kg",
  XL: "31-40kg",
  GIANT: "> 40kg",
};

const COAT_LABELS: Record<CoatType, string> = {
  SHORT: "Pelo Curto",
  MEDIUM: "Pelo Médio",
  LONG: "Pelo Longo",
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  GROOMING: "Banhos e Tosquias",
  HYGIENE: "Higiene",
  EXOTIC: "Exóticos",
  SPA: "Spa & Tratamentos",
};

// Fix Type for Price
type ServiceWithData = Omit<Service, "createdAt" | "updatedAt"> & { 
  options: (Omit<ServiceOption, "price"> & { price: number })[] 
};

export default function ServicesMatrix({ services }: { services: ServiceWithData[] }) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("GROOMING");
  
  const filteredServices = services.filter(s => s.category === activeCategory);
  
  const [manualActiveServiceId, setManualActiveServiceId] = useState("");
  
  const activeServiceId = manualActiveServiceId && filteredServices.find(s => s.id === manualActiveServiceId) 
    ? manualActiveServiceId 
    : filteredServices[0]?.id || "";

  const activeService = services.find(s => s.id === activeServiceId);

  // 1. SMART LOGIC: Determine Visibility
  const { visibleCoats, visibleSizes } = useMemo(() => {
    if (!activeService) return { visibleCoats: [], visibleSizes: [] };

    // Check if there is a "Universal" option (Any Size OR Any Coat)
    const hasUniversalOption = activeService.options.some(opt => opt.petSize === null || opt.coatType === null);

    // If there is a generic price (like Nail Cut), we show ALL rows/cols to fill the table nicely
    if (hasUniversalOption) {
      return { visibleCoats: COATS, visibleSizes: SIZES };
    }

    // Otherwise, calculate strict availability
    const availableCoats = COATS.filter(coat => 
      activeService.options.some(opt => opt.coatType === coat)
    );
    const availableSizes = SIZES.filter(size => 
      activeService.options.some(opt => opt.petSize === size)
    );

    return {
      visibleCoats: availableCoats.length > 0 ? availableCoats : COATS, 
      visibleSizes: availableSizes.length > 0 ? availableSizes : SIZES
    };
  }, [activeService]);

  // 2. SMART PRICING: Fallback Logic
  const getPrice = (size: PetSize, coat: CoatType) => {
    if (!activeService) return "-";

    // Priority 1: Exact Match (Size + Coat)
    let opt = activeService.options.find((o: any) => o.petSize === size && o.coatType === coat);

    // Priority 2: Size Match + Any Coat (e.g. Bath depends on size, not hair)
    if (!opt) {
      opt = activeService.options.find((o: any) => o.petSize === size && o.coatType === null);
    }

    // Priority 3: Any Size + Coat Match
    if (!opt) {
      opt = activeService.options.find((o: any) => o.petSize === null && o.coatType === coat);
    }

    // Priority 4: Universal Price (Any Size + Any Coat)
    if (!opt) {
      opt = activeService.options.find((o: any) => o.petSize === null && o.coatType === null);
    }

    return opt ? `${opt.price.toFixed(2)}€` : "-";
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      
      {/* 1. CATEGORY TABS (Segmented Control Style) */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl shadow-inner scrollbar-hide max-w-full overflow-x-auto">
          {Object.keys(CATEGORY_LABELS).map((cat) => {
             if (!services.some(s => s.category === cat)) return null;
             const isActive = activeCategory === cat;
             
             return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat as ServiceCategory); setManualActiveServiceId(""); }}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }
                `}
              >
                {CATEGORY_LABELS[cat as ServiceCategory]}
              </button>
             )
          })}
        </div>
      </div>

      {/* 2. SERVICE SELECTOR (Pill Tabs) - Flex Wrap */}
      <div className="relative group">
        <div className="flex flex-wrap gap-3 justify-center py-4 px-2">
          {filteredServices.map((service) => {
            const isActive = activeServiceId === service.id;
            return (
              <button
                key={service.id}
                onClick={() => setManualActiveServiceId(service.id)}
                className={`
                  px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-200
                  ${isActive 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary"
                  }
                `}
              >
                {service.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. PRICING TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {filteredServices.length === 0 ? (
           <div className="p-12 text-center text-gray-400 italic">
             Sem serviços disponíveis nesta categoria.
           </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide relative">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                   {/* Top Left Corner */}
                  <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">
                    Peso
                  </th>
                  {/* Columns (Coats) */}
                  {visibleCoats.map(coat => (
                    <th key={coat} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      {COAT_LABELS[coat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSizes.map((size) => (
                  <tr key={size} className="group hover:bg-slate-50/50 transition-colors">
                    {/* Size Row Header */}
                    <td className="p-4 pl-6 bg-white group-hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-800 text-sm">{SIZE_LABELS[size]}</span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{size}</span>
                      </div>
                    </td>
                    
                    {/* Price Cells */}
                    {visibleCoats.map(coat => {
                       const priceStr = getPrice(size, coat);
                       const isDash = priceStr === '-';
                       return (
                        <td key={coat} className="p-4 text-center">
                           <span className={`inline-block py-1.5 px-3 rounded-lg text-base font-extrabold table-nums
                             ${isDash 
                               ? "text-slate-300 bg-slate-50 font-normal" 
                               : "text-primary bg-primary-light group-hover:bg-primary/20 group-hover:text-primary-hover"
                             } transition-colors`}>
                              {priceStr}
                           </span>
                        </td>
                       );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Description/Footer (Moved to Bottom) */}
        {activeService?.description && (
          <div className="bg-primary-light/50 border-t border-primary/20 px-6 py-4 flex gap-3 items-start">
            <span className="text-primary text-lg">💡</span>
            <p className="text-sm text-primary-hover leading-relaxed font-medium">
              {activeService.description}
            </p>
          </div>
        )}
      </div>

      <div className="text-center">
         <p className="text-xs text-slate-500">
           * Valores sujeitos a avaliação presencial consoante o comportamento e estado do pelo. IVA incluído.
         </p>
      </div>
    </div>
  );
}