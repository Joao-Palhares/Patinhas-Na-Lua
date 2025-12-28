"use client";

import { useState, useMemo, useEffect } from "react";
import { submitBooking, getAvailableSlots } from "./actions";
import { Pet, Service, ServiceOption } from "@prisma/client";

// Adjust type to match what we passed from the page (price is number)
type ServiceWithOptions = Omit<Service, "createdAt" | "updatedAt"> & { 
  options: (Omit<ServiceOption, "price"> & { price: number })[] 
};

interface Props {
  user: { id: string; name: string | null ; nif?: string | null;};
  pets: Pet[];
  services: ServiceWithOptions[];
  initialDate?: string;
}

const SPECIES_ICON_MAP: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  RABBIT: "🐰",
  OTHER: "🐾"
};

export default function BookingWizard({ user, pets, services, initialDate }: Props) {
  const [step, setStep] = useState(1);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [date, setDate] = useState(initialDate || "");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [wantsNif, setWantsNif] = useState(false);

  // 1. FIND SELECTED DATA
  const selectedPet = pets.find(p => p.id === selectedPetId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  // --- FILTER SERVICES BASED ON PET SPECIES ---
  const filteredServices = useMemo(() => {
    if (!selectedPet) return services; 

    if (selectedPet.species === "DOG") {
      return services.filter(s => s.category !== "EXOTIC");
    }
    
    if (selectedPet.species === "CAT" || selectedPet.species === "RABBIT") {
      return services.filter(s => s.category === "EXOTIC");
    }

    return services;
  }, [selectedPet, services]);

  // --- RESET SERVICE IF PET CHANGES ---
  useEffect(() => {
    if (selectedServiceId && !filteredServices.find(s => s.id === selectedServiceId)) {
        setSelectedServiceId("");
    }
  }, [selectedPetId, filteredServices, selectedServiceId]);


  // 2. CALCULATE PRICE AUTOMATICALLY
  const priceDetails = useMemo(() => {
    if (!selectedPet || !selectedService) return null;

    let option = selectedService.options.find(opt => 
      opt.petSize === selectedPet.sizeCategory && 
      opt.coatType === selectedPet.coatType
    );

    if (!option) {
      option = selectedService.options.find(opt => 
        opt.petSize === selectedPet.sizeCategory && opt.coatType === null
      );
    }

    if (!option) {
      option = selectedService.options.find(opt => 
        opt.petSize === null && opt.coatType === null
      );
    }

    return option || null;
  }, [selectedPet, selectedService]);

  // --- FETCH SLOTS ---
  useEffect(() => {
    if (step === 3 && date && priceDetails) {
      setLoadingSlots(true);
      const duration = priceDetails.durationMax || priceDetails.durationMin || 60;
      
      getAvailableSlots(date, duration).then((slots) => {
        setAvailableSlots(slots);
        setLoadingSlots(false);
      });
    }
  }, [step, date, priceDetails]); 

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      
      {/* HEADER STEPS */}
      <div className="bg-slate-50 p-4 border-b flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
        <span className={step >= 1 ? "text-blue-600" : ""}>1. Animal</span>
        <span className={step >= 2 ? "text-blue-600" : ""}>2. Serviço</span>
        <span className={step >= 3 ? "text-blue-600" : ""}>3. Horário</span>
        <span className={step >= 4 ? "text-blue-600" : ""}>4. Fim</span>
      </div>

      <div className="p-8">
        <form action={submitBooking}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="petId" value={selectedPetId} />
          <input type="hidden" name="serviceId" value={selectedServiceId} />
          <input type="hidden" name="price" value={priceDetails?.price || 0} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="date" value={date} />

          {/* STEP 1: SELECT PET */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Selecione o Pet 🐾</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pets.map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      selectedPetId === pet.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-300"
                    }`}
                  >
                      <span className="text-lg" title={pet.species}>
                        {SPECIES_ICON_MAP[pet.species] || "🐾"}
                      </span>
                    <div>
                      <p className="font-bold text-gray-800">{pet.name}</p>
                      <p className="text-xs text-gray-500">{pet.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                type="button"
                disabled={!selectedPetId}
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP 2: SELECT SERVICE (FIXED SCROLL) */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">O que vamos fazer hoje? ✂️</h2>
              
              {/* FIXED HEIGHT CONTAINER WITH SCROLL */}
              <div className="border-2 border-gray-100 rounded-xl p-2 bg-gray-50">
                <div className="h-80 overflow-y-auto pr-2 space-y-2">
                  
                  {filteredServices.map(service => (
                    <div 
                      key={service.id} 
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition bg-white ${
                        selectedServiceId === service.id ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-100 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-bold text-gray-800">{service.name}</p>
                      {service.description && <p className="text-sm text-gray-500">{service.description}</p>}
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                      <p className="text-center text-gray-500 italic p-4">Não existem serviços disponíveis para este tipo de animal.</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border font-bold text-gray-600">Voltar</button>
                <button 
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME (FIXED SCROLL) */}
          {step === 3 && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Escolha o Horário 📅</h2>
                
                {/* Price Banner */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                <div>
                    <p className="text-sm text-green-800 font-bold uppercase">Orçamento Estimado</p>
                    <p className="text-xs text-green-600">Baseado no tamanho do {selectedPet?.name}</p>
                </div>
                <div className="text-right">
                    {priceDetails ? (
                    <>
                        <p className="text-2xl font-bold text-green-700">{Number(priceDetails.price).toFixed(2)}€</p>
                        <p className="text-xs text-green-600">{priceDetails.durationMin} - {priceDetails.durationMax || "?"} min</p>
                    </>
                    ) : (
                    <p className="text-lg font-bold text-green-700">Sob Consulta</p>
                    )}
                </div>
                </div>

                {/* MAIN SELECTION GRID - Added items-start to prevent stretching */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* LEFT: DATE PICKER */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Data</label>
                    <input 
                    name="date" 
                    type="date" 
                    required 
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => { 
                        setDate(e.target.value); 
                        setTime(""); 
                    }}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none text-lg font-medium" 
                    />
                </div>

                {/* RIGHT: TIME SLOTS */}
                <div className="flex flex-col">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                    Horários Disponíveis
                    </label>

                    {loadingSlots ? (
                    <div className="text-blue-500 text-sm animate-pulse p-2 font-bold">Calculando vagas...</div>
                    ) : availableSlots.length === 0 ? (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                        {!date ? "Selecione uma data primeiro." : "Sem vagas disponíveis."}
                    </div>
                    ) : (
                    /* Background Container */
                    <div className="bg-gray-50 rounded-xl border-2 border-gray-100 p-2">
                        {/* 
                            SCROLLABLE BOX: 
                            - Changed max-h-[350px] to h-80 (fixed height)
                            - This matches your Step 2 logic which is working 
                        */}
                        <div className="flex flex-col gap-2 overflow-y-auto h-80 pr-2 custom-scrollbar">
                        {availableSlots.map((slot) => (
                            <button
                            key={slot}
                            type="button"
                            onClick={() => setTime(slot)}
                            className={`w-full py-3 px-4 rounded-lg text-sm font-bold border-2 transition shrink-0 ${
                                time === slot
                                ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
                            }`}
                            >
                            {slot}
                            </button>
                        ))}
                        </div>
                    </div>
                    )}
                </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-xl border font-bold text-gray-600">Voltar</button>
                <button 
                    type="button"
                    disabled={!date || !time}
                    onClick={() => setStep(4)}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg"
                >
                    Ver Resumo
                </button>
                </div>
            </div>
            )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Tudo pronto? 📝</h2>
                <p className="text-gray-500 text-sm">Confirme os detalhes abaixo</p>
              </div>
              
              {/* TICKET CARD */}
              <div className="bg-blue-50 border-2 border-blue-100 rounded-xl overflow-hidden p-6 relative">
                {/* Dashed Line Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-200"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-blue-200 pb-3">
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Cliente</p>
                      <p className="text-lg font-bold text-gray-700">{user.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Animal</p>
                      <p className="text-lg font-bold text-gray-700">{selectedPet?.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Serviço</p>
                      <p className="font-bold text-gray-700">{selectedService?.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Data e Hora</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {new Date(date).toLocaleDateString('pt-PT')} <span className="text-blue-500">às {time}</span>
                      </p>
                    </div>
                  </div>

                  {/* NIF CHECKBOX */}
                  <div 
                    onClick={() => setWantsNif(!wantsNif)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      wantsNif 
                        ? "bg-green-100 border-green-300" 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      wantsNif ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                    }`}>
                      {wantsNif && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${wantsNif ? "text-green-800" : "text-gray-600"}`}>
                        Desejo fatura com NIF
                      </p>
                      {wantsNif && (
                        <p className="text-xs text-green-700">
                          NIF associado: <span className="font-mono">{user.nif || "Não definido no perfil"}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Total a Pagar</span>
                    <span className="text-3xl font-black text-blue-600">
                      {priceDetails?.price.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="px-6 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Voltar</button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-xl transform hover:scale-[1.02] transition"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}