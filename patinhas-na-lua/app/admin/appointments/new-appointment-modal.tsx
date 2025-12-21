"use client";

import { useState } from "react";
import { createManualAppointment } from "./actions";

// Types for the data passed from the server
interface Props {
  clients: any[]; // List of users with pets
  services: any[]; // List of services
}

export default function NewAppointmentModal({ clients, services }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  // State to handle the "Client -> Pet" logic
  const [selectedClientId, setSelectedClientId] = useState("");
  
  // Find the selected client to get their pets
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const availablePets = selectedClient ? selectedClient.pets : [];

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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Novo Agendamento Manual</h3>

            <form action={async (formData) => {
              await createManualAppointment(formData);
              setIsOpen(false);
            }} className="space-y-4">
              
              {/* 1. SELECT CLIENT */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Cliente</label>
                <select 
                  name="userId" 
                  required 
                  className="w-full border p-2 rounded bg-gray-50"
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Selecione o Cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. SELECT PET (Disabled until client picked) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Pet</label>
                <select 
                  name="petId" 
                  required 
                  disabled={!selectedClientId}
                  className="w-full border p-2 rounded bg-gray-50 disabled:opacity-50"
                >
                  <option value="">Selecione o Pet...</option>
                  {availablePets.map((pet: any) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed})
                    </option>
                  ))}
                </select>
                {selectedClientId && availablePets.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Este cliente não tem pets registados.</p>
                )}
              </div>

              {/* 3. DATE & TIME */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Data</label>
                  <input name="date" type="date" required className="w-full border p-2 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hora</label>
                  <input name="time" type="time" required className="w-full border p-2 rounded bg-gray-50" />
                </div>
              </div>

              {/* 4. SERVICE & PRICE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Serviço Base</label>
                  <select name="serviceId" required className="w-full border p-2 rounded bg-gray-50">
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Preço Final (€)</label>
                  <input 
                    name="price" 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="30.00" 
                    className="w-full border p-2 rounded bg-gray-50" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 border py-2 rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">Agendar</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}