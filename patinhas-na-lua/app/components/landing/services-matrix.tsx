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
    <div className="w-full max-w-5xl mx-auto">
      
      {/* CATEGORY TABS */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {Object.keys(CATEGORY_LABELS).map((cat) => {
           if (!services.some(s => s.category === cat)) return null;
           
           return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat as ServiceCategory); setManualActiveServiceId(""); }}
              className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider border-2 transition-all
                ${activeCategory === cat 
                  ? "bg-[#5A4633] text-white border-[#5A4633]" 
                  : "bg-transparent text-[#5A4633] border-[#5A4633] hover:bg-[#EBE5CE]"
                }`}
            >
              {CATEGORY_LABELS[cat as ServiceCategory]}
            </button>
           )
        })}
      </div>

      {/* SERVICE TABS */}
      <div className="flex flex-wrap border-2 border-black bg-white">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => setManualActiveServiceId(service.id)}
            className={`flex-1 py-3 px-4 font-bold text-xs md:text-sm uppercase tracking-wide transition-colors whitespace-nowrap
              ${activeServiceId === service.id 
                ? "bg-[#a6c4f5] text-black" 
                : "bg-white text-gray-500 hover:bg-gray-100"
              } border-r last:border-r-0 border-black`}
          >
            {service.name}
          </button>
        ))}
      </div>

      {/* MATRIX TABLE */}
      <div className="border-2 border-t-0 border-black bg-white overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">Sem serviços nesta categoria.</div>
        ) : (
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#d1d5db]">
                <th className="p-3 border-b border-r border-black text-left pl-6 text-gray-900 font-bold">
                  Peso <span className="font-normal text-xs block text-gray-600">(Tamanho)</span>
                </th>
                {visibleCoats.map(coat => (
                  <th key={coat} className="p-3 border-b border-l border-black text-gray-900 font-bold">
                    {COAT_LABELS[coat]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleSizes.map((size, index) => (
                <tr key={size} className={index % 2 === 0 ? "bg-[#f3f4f6]" : "bg-white"}>
                  <td className="p-3 border-t border-r border-black text-left pl-6 font-bold text-gray-800">
                    {SIZE_LABELS[size]}
                  </td>
                  {visibleCoats.map(coat => (
                    <td key={coat} className="p-3 border-t border-l border-black font-medium text-gray-900">
                      {getPrice(size, coat)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {activeService?.description && (
          <div className="p-4 bg-yellow-50 border-t border-black text-sm text-gray-700 italic border-l-4 border-l-yellow-400">
            * {activeService.description}
          </div>
        )}
      </div>
    </div>
  );
}