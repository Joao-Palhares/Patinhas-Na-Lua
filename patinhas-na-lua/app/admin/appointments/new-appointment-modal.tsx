"use client";

import { useState, useEffect, useMemo } from "react";
import { createManualAppointment } from "./actions";
import { getAvailableSlots } from "@/app/dashboard/book/actions"; 
import { ServiceCategory } from "@prisma/client";

interface Props {
  clients: any[];
  services: any[]; 
}

export default function NewAppointmentModal({ clients, services }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Selection States
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  
  // Data States
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState<number | "">(""); 
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- HELPER: RESET FORM ---
  // We call this whenever the modal closes
  const closeAndReset = () => {
    setIsOpen(false);
    // Add a small timeout to clear data AFTER animation, or clear immediately
    setSelectedClientId("");
    setSelectedPetId("");
    setSelectedServiceId("");
    setDate("");
    setTime("");
    setPrice("");
    setAvailableSlots([]);
  };

  // --- COMPUTED VALUES ---
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const availablePets = selectedClient ? selectedClient.pets : [];
  const selectedPet = availablePets.find((p: any) => p.id === selectedPetId);
  
  // --- FILTER SERVICES BASED ON PET SPECIES ---
  const filteredServices = useMemo(() => {
    if (!selectedPet) return [];

    // If Dog -> Show everything EXCEPT "EXOTIC"
    if (selectedPet.species === "DOG") {
      return services.filter(s => s.category !== "EXOTIC");
    }
    
    // If Cat/Rabbit -> Show ONLY "EXOTIC" (or generic hygiene if applicable)
    if (selectedPet.species === "CAT" || selectedPet.species === "RABBIT") {
      return services.filter(s => s.category === "EXOTIC");
    }

    return services;
  }, [selectedPet, services]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  // --- 1. AUTO-CALCULATE PRICE & DURATION ---
  const serviceDetails = useMemo(() => {
    if (!selectedPet || !selectedService) return null;

    let option = selectedService.options.find((opt: any) => 
      opt.petSize === selectedPet.sizeCategory && 
      opt.coatType === selectedPet.coatType
    );

    if (!option) {
      option = selectedService.options.find((opt: any) => 
        opt.petSize === selectedPet.sizeCategory && opt.coatType === null
      );
    }

    if (!option) {
      option = selectedService.options.find((opt: any) => 
        opt.petSize === null && opt.coatType === null
      );
    }

    return option || null;
  }, [selectedPet, selectedService]);

  useEffect(() => {
    if (serviceDetails) {
      setPrice(serviceDetails.price);
    }
  }, [serviceDetails]);

  // --- 2. SLOT CALCULATOR ---
  useEffect(() => {
    if (date && selectedService) {
      setLoadingSlots(true);
      setTime(""); 
      const duration = serviceDetails?.durationMin || selectedService.options[0]?.durationMin || 60;

      getAvailableSlots(date, duration).then((slots) => {
        setAvailableSlots(slots);
        setLoadingSlots(false);
      });
    }
  }, [date, selectedService, serviceDetails]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition"
      >
        + Novo Agendamento
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAndReset} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Novo Agendamento Manual</h3>

            <form action={async (formData) => {
              await createManualAppointment(formData);
              closeAndReset(); // Reset on success
            }} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUMN 1: WHO & WHAT */}
                <div className="space-y-4">
                  {/* CLIENT */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">1. Cliente</label>
                    <select 
                      name="userId" 
                      required 
                      value={selectedClientId}
                      className="w-full border border-gray-300 p-2.5 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => { setSelectedClientId(e.target.value); setSelectedPetId(""); }}
                    >
                      <option value="" className="text-gray-500">Selecione o Cliente...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id} className="text-gray-900">
                          {client.name} ({client.phone || "Sem contato"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PET */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">2. Pet</label>
                    <select 
                      name="petId" 
                      required 
                      disabled={!selectedClientId}
                      value={selectedPetId}
                      onChange={(e) => { setSelectedPetId(e.target.value); setSelectedServiceId(""); }} // Reset Service when Pet changes
                      className="w-full border border-gray-300 p-2.5 rounded bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Selecione o Pet...</option>
                      {availablePets.map((pet: any) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed || "?"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SERVICE (Now Filtered) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">3. Serviço Base</label>
                    <select 
                      name="serviceId" 
                      required 
                      disabled={!selectedPetId}
                      value={selectedServiceId}
                      className="w-full border border-gray-300 p-2.5 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                      <option value="">
                        {!selectedPetId ? "Selecione o Pet primeiro..." : "Selecione o Serviço..."}
                      </option>
                      
                      {/* Only show relevant services */}
                      {filteredServices.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PRICE */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Preço Final (€)</label>
                    <div className="relative">
                      <input 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        required 
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        placeholder="0.00" 
                        className="w-full border border-gray-300 p-2.5 rounded bg-white text-gray-900 font-bold" 
                      />
                      {serviceDetails && (
                        <span className="absolute right-3 top-2.5 text-xs text-green-600 font-bold bg-green-50 px-1 rounded">
                          {serviceDetails.durationMin} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: WHEN */}
                <div className="space-y-4">
                  
                  {/* DATA */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">4. Data</label>
                    <input 
                      name="date" 
                      type="date" 
                      required 
                      min={new Date().toISOString().split("T")[0]} 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded bg-white text-gray-900" 
                    />
                  </div>

                  {/* SLOTS GRID */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">5. Horários Disponíveis</label>
                    <input type="hidden" name="time" value={time} required /> 
                    
                    <div className="h-48 border border-gray-300 rounded-lg p-2 overflow-y-auto bg-gray-50">
                      {!date || !selectedServiceId ? (
                        <p className="text-xs text-gray-500 text-center mt-10">Escolha o Serviço e Data primeiro.</p>
                      ) : loadingSlots ? (
                        <p className="text-xs text-blue-600 text-center mt-10 animate-pulse font-bold">A calcular agenda...</p>
                      ) : availableSlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                           <p className="text-xs text-red-600 font-bold">Dia cheio ou sem vagas.</p>
                           <p className="text-[10px] text-gray-500 mt-1">Verifique o intervalo de almoço (12-13) ou horário (9-18).</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setTime(slot)}
                              className={`text-xs font-bold py-2 rounded border transition
                                ${time === slot 
                                  ? "bg-green-600 text-white border-green-600 shadow-md scale-105" 
                                  : "bg-white text-gray-800 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                                }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {time && <p className="text-xs text-green-700 font-bold mt-2 text-right">Selecionado: {time}</p>}
                  </div>

                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <button 
                  type="button" 
                  onClick={closeAndReset} 
                  className="flex-1 border border-gray-300 text-gray-700 bg-white py-3 rounded-lg hover:bg-gray-100 font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!time || !selectedClientId || !selectedPetId}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Confirmar Agendamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}