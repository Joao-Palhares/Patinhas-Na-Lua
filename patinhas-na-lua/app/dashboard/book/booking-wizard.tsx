"use client";

import { useState, useMemo, useEffect } from "react";
import { submitBooking, getAvailableSlots } from "./actions";
import { Pet, Service, ServiceOption } from "@prisma/client";
import { toast } from "sonner"; // + Import Toast

import dynamic from 'next/dynamic';
const LocationPicker = dynamic(() => import('@/app/components/location-picker'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">A carregar mapa...</div>
});

// Adjust type to match what we passed from the page (price is number)
type ServiceWithOptions = Omit<Service, "createdAt" | "updatedAt"> & {
  options: (Omit<ServiceOption, "price"> & { price: number })[];
  isMobileAvailable: boolean;
};

// Manual definition to avoid "Module has no exported member" if client isn't regenerated
interface BusinessSettings {
  id: string;
  baseLatitude: number;
  baseLongitude: number;
  baseAddress: string | null;
  zone1RadiusKm: number;
  zone1Fee: any;
  zone2RadiusKm: number;
  zone2Fee: any;
  zone3Fee: any;
  maxRadiusKm: number;
  referralRewardPercentage: number;
  updatedAt: Date;
}
import { getBusinessSettings } from "@/app/admin/settings/actions";

type SerializedBusinessSettings = Omit<BusinessSettings, 'zone1Fee' | 'zone2Fee' | 'zone3Fee'> & {
  zone1Fee: number;
  zone2Fee: number;
  zone3Fee: number;
};

interface Props {
  user: { id: string; name: string | null; nif: string | null };
  pets: any[];
  services: ServiceWithOptions[];
  initialDate: string;
  closedDays?: number[];
  absenceRanges?: { from: Date; to: Date; reason?: string }[];
  disabledRules?: string[];
}

const SPECIES_ICON_MAP: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  RABBIT: "🐰",
  OTHER: "🐾"
};

export default function BookingWizard({ user, pets, services, initialDate, closedDays, absenceRanges, disabledRules = [] }: Props) {
  const [step, setStep] = useState(1);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [date, setDate] = useState(initialDate || "");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // LOCATIONS
  const [locationType, setLocationType] = useState<"SALON" | "MOBILE">("SALON");
  const [mobileAddress, setMobileAddress] = useState("");
  const [travelFee, setTravelFee] = useState(0);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [settings, setSettings] = useState<SerializedBusinessSettings | null>(null);

  // RECURRENCE
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    // Fetch settings on mount
    getBusinessSettings().then(setSettings);
  }, []);

  const [wantsNif, setWantsNif] = useState(false);

  // 1. FIND SELECTED DATA
  const selectedPet = pets.find(p => p.id === selectedPetId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  // --- FILTER SERVICES BASED ON PET SPECIES & LOCATION ---
  const filteredServices = useMemo(() => {
    if (!selectedPet) return services;

    let result = services;

    // 1. Filter by Species
    if (selectedPet.species === "DOG") {
      result = result.filter(s => s.category !== "EXOTIC");
    }

    // 2. Filter by Location Availability
    if (locationType === "MOBILE") {
      result = result.filter(s => s.isMobileAvailable);

      // RULE: Dogs > 20kg cannot have "Main Services" (Bath/Grooming) on Mobile
      // "LARGE" starts at 21kg.
      const bigSizes = ["LARGE", "XL", "GIANT"];
      if (bigSizes.includes(selectedPet.sizeCategory)) {
        // Exclude Grooming (Bath + Cuts)
        result = result.filter(s => s.category !== "GROOMING");
      }
    }

    return result;
  }, [selectedPet, services, locationType]);

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

    // FALLBACK
    if (!option && selectedPet.species !== "DOG") {
      option = selectedService.options.find(opt => opt.petSize === null && opt.coatType === null);
      if (!option && selectedService.options.length > 0) {
        option = selectedService.options[0];
      }
    }

    return option || null;
  }, [selectedPet, selectedService]);

  // --- COUPON STATE ---
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [discount, setDiscount] = useState(0);

  // --- HANDLER ---
  const handleValidateCoupon = async () => {
    setIsValidatingCoupon(true);
    setCouponMessage("");
    setDiscount(0);

    try {
      const { validateCoupon } = await import("./actions");
      const res = await validateCoupon(couponCode);

      if (res.valid) {
        setDiscount(res.discount || 0);
        setCouponMessage(`✅ Código aceite! Desconto de ${res.discount === 100 ? "100%" : res.discount + "%"} aplicado.`);
      } else {
        setCouponMessage("❌ " + (res.message || "Código inválido"));
      }
    } catch (err) {
      console.error(err);
      setCouponMessage("❌ Erro ao validar código.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const calculateFinalPrice = (basePrice: number) => {
    if (discount === 100) return 0;
    return basePrice - (basePrice * (discount / 100));
  };

  // --- FETCH SLOTS ---
  useEffect(() => {
    if (step === 4 && date && priceDetails) {
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
      <div className="bg-slate-50 p-4 border-b flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider overflow-x-auto">
        <span className={step >= 1 ? "text-blue-600" : ""}>1. Animal</span>
        <span className={step >= 2 ? "text-blue-600" : ""}>2. Local</span>
        <span className={step >= 3 ? "text-blue-600" : ""}>3. Serviço</span>
        <span className={step >= 4 ? "text-blue-600" : ""}>4. Horário</span>
        <span className={step >= 5 ? "text-blue-600" : ""}>5. Fim</span>
      </div>

      <div className="p-8">
        <form action={submitBooking}>
          {/* HIDDEN FIELDS */}
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="petId" value={selectedPetId} />
          <input type="hidden" name="serviceId" value={selectedServiceId} />
          <input type="hidden" name="price" value={priceDetails?.price || 0} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="couponCode" value={discount > 0 ? couponCode : ""} />
          <input type="hidden" name="locationType" value={locationType} />
          <input type="hidden" name="mobileAddress" value={mobileAddress} />
          <input type="hidden" name="travelFee" value={travelFee} />
          <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />

          {/* STEP 1: SELECT PET */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Selecione o Pet 🐾</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pets.map(pet => {
                  // Check exact rule match: "SPECIES:SIZE"
                  const ruleKey = `${pet.species}:${pet.sizeCategory}`;
                  const isDisabled = pet.sizeCategory && disabledRules.includes(ruleKey);
                  
                  return (
                    <div
                      key={pet.id}
                      onClick={() => !isDisabled && setSelectedPetId(pet.id)}
                      className={`relative p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                        isDisabled 
                          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed" 
                          : selectedPetId === pet.id 
                            ? "border-blue-600 bg-blue-50 cursor-pointer" 
                            : "border-gray-100 hover:border-blue-300 cursor-pointer"
                      }`}
                    >
                      <span className="text-lg" title={pet.species}>
                        {SPECIES_ICON_MAP[pet.species] || "🐾"}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.breed}</p>
                      </div>

                      {isDisabled && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            Indisponível Temporariamente
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-bold text-gray-800">Onde será o serviço? 🏠</h2>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => { setLocationType("SALON"); setTravelFee(0); }}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition text-center ${locationType === "SALON" ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="text-4xl mb-2">🏢</div>
                  <h3 className="font-bold text-gray-800">No Salão</h3>
                  <p className="text-xs text-gray-500">{settings?.baseAddress || "Localização Base"}</p>
                </div>

                <div
                  onClick={() => setLocationType("MOBILE")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition text-center ${locationType === "MOBILE" ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="text-4xl mb-2">🚐</div>
                  <h3 className="font-bold text-gray-800">Ao Domicílio</h3>
                  <p className="text-xs text-gray-500">Vamos até si!</p>
                </div>
              </div>

              {locationType === "MOBILE" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {settings && <LocationPicker
                    settings={settings}
                    onLocationSelect={(data) => {
                      setMobileAddress(data.address || "");
                      setTravelFee(data.fee);
                      setIsAddressValid(data.valid);
                    }}
                  />}

                  {mobileAddress && (
                    <div className={`mt-4 p-4 rounded-xl border ${isAddressValid ? "bg-green-100 border-green-200 text-green-800" : "bg-red-100 border-red-200 text-red-800"}`}>
                      <p className="text-xs font-bold uppercase mb-1">Morada Selecionada:</p>
                      <p className="font-bold">{mobileAddress}</p>
                      {!isAddressValid ? (
                        <p className="text-sm mt-2 font-bold">⚠️ Serviço indisponível nesta área (Muito longe).</p>
                      ) : (
                        <p className="text-sm mt-2 font-bold">✅ Taxa de Deslocação: {travelFee}€</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border font-bold text-gray-600">Voltar</button>
                <button
                  type="button"
                  disabled={locationType === "MOBILE" && (!mobileAddress || !isAddressValid)}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SERVICE */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">O que vamos fazer hoje? ✂️</h2>

              <div className="border-2 border-gray-100 rounded-xl p-2 bg-gray-50">
                <div className="h-80 overflow-y-auto pr-2 space-y-2">

                  {filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition bg-white ${selectedServiceId === service.id ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-100 hover:border-blue-300"
                        }`}
                    >
                      <p className="font-bold text-gray-800">{service.name}</p>
                      {service.description && <p className="text-sm text-gray-500">{service.description}</p>}
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                    <p className="text-center text-gray-500 italic p-4">
                      {locationType === "MOBILE"
                        ? "Não existem serviços ao domicílio disponíveis para este tamanho/animal."
                        : "Não existem serviços disponíveis para este tipo de animal."}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-xl border font-bold text-gray-600">Voltar</button>
                <button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(4)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DATE & TIME */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Escolha o Horário 📅</h2>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Data</label>
                  <input
                    name="date"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) { setDate(""); return; }

                      const selectedDate = new Date(val);
                      selectedDate.setHours(0, 0, 0, 0);

                      const conflict = absenceRanges?.find(range => {
                        const start = new Date(range.from);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(range.to);
                        end.setHours(23, 59, 59, 999);
                        return selectedDate >= start && selectedDate <= end;
                      });

                      if (conflict) {
                        const reasonMsg = conflict.reason ? `Motivo: ${conflict.reason}` : "";
                        toast.warning("Estamos fechados nesta data. 🚫", {
                          description: reasonMsg || "Por favor, selecione outro dia."
                        });
                        e.target.value = "";
                        setDate("");
                        return;
                      }

                      setDate(val);
                      setTime("");
                    }}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none text-lg font-medium"
                  />
                </div>

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
                    <div className="bg-gray-50 rounded-xl border-2 border-gray-100 p-2">
                      <div className="flex flex-col gap-2 overflow-y-auto h-80 pr-2 custom-scrollbar">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setTime(slot)}
                            className={`w-full py-3 px-4 rounded-lg text-sm font-bold border-2 transition shrink-0 ${time === slot
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

                  {/* RECURRENCE OPTION */}
                  <div className="mt-6 bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 shadow-sm">
                    <input
                      type="checkbox"
                      id="recurrence"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="recurrence" className="block text-sm font-bold text-purple-900 cursor-pointer">
                        Repetir a cada 4 semanas? (Recomendado)
                      </label>
                      <p className="text-xs text-purple-700 mt-1">
                        Garante o lugar do {selectedPet?.name} e evita filas de espera.
                        Agendamos automaticamente para os próximos 6 meses.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(3)} className="px-4 py-3 rounded-xl border font-bold text-gray-600">Voltar</button>
                <button
                  type="button"
                  disabled={!date || !time}
                  onClick={() => setStep(5)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg"
                >
                  Ver Resumo
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Tudo pronto? 📝</h2>
                <p className="text-gray-500 text-sm">Confirme os detalhes abaixo</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-100 rounded-xl overflow-hidden p-6 relative">
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
                      <p className="text-xs text-gray-400 mt-1">
                        {locationType === "MOBILE" ? `🏠 ${mobileAddress}` : "🏢 Salon"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Data e Hora</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {new Date(date).toLocaleDateString('pt-PT')} <span className="text-blue-500">às {time}</span>
                      </p>
                      {isRecurring && (
                        <p className="text-xs font-bold text-purple-600 mt-1">
                          🔄 Repete a cada 4 semanas (6x)
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setWantsNif(!wantsNif)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${wantsNif
                      ? "bg-green-100 border-green-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${wantsNif ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
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

                  <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono placeholder:normal-case"
                        placeholder="Código de Desconto / Oferta"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode}
                        className="bg-gray-800 text-white text-xs font-bold px-4 rounded-lg disabled:opacity-50"
                      >
                        {isValidatingCoupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs mt-2 font-bold ${couponMessage.includes("inválido") ? "text-red-500" : "text-green-600"}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>


                  <div className="pt-2 flex justify-between items-center border-t border-blue-200 pt-4 mt-4">
                    <div className="text-sm text-gray-500">
                      <p>Serviço: {priceDetails?.price.toFixed(2)}€</p>
                      {travelFee > 0 && <p>Deslocação: {travelFee.toFixed(2)}€</p>}
                      {discount > 0 && <p className="text-green-600">Desconto: -{(priceDetails?.price || 0) * discount / 100}€</p>}
                    </div>
                    <div className="text-right">
                      {discount > 0 && (
                        <span className="block text-xs text-gray-400 line-through decoration-red-500">
                          {(priceDetails!.price + travelFee).toFixed(2)}€
                        </span>
                      )}
                      <span className={`text-3xl font-black ${discount > 0 ? "text-green-600" : "text-blue-600"}`}>
                        {(calculateFinalPrice(priceDetails?.price || 0) + travelFee).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(4)} className="px-6 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Voltar</button>
                <SubmitButton />
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-xl transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "A Agendar..." : "Confirmar Agendamento"}
    </button>
  );
}