"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { createOfflineClientAction } from "./actions";
import { toast } from "sonner";
import { defaultCountries, FlagImage, parseCountry } from 'react-international-phone';
import { ChevronDown, Search } from "lucide-react";

export default function RegisterClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* --- PHONE LOGIC --- */
  const [phoneState, setPhoneState] = useState({ iso2: 'pt', dial: '351', phone: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };
    if(isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleCountrySelect = (country: any) => {
    const parsed = parseCountry(country);
    setPhoneState(prev => ({ ...prev, iso2: parsed.iso2, dial: parsed.dialCode }));
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const filteredCountries = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return defaultCountries.filter((c: any) => {
      const parsed = parseCountry(c);
      return parsed.name.toLowerCase().includes(lower) || parsed.dialCode.includes(lower);
    });
  }, [searchQuery]);

  // Dynamic Max Length enforcement
  const currentMaxLength = phoneState.iso2 === 'pt' ? 9 : phoneState.iso2 === 'br' ? 11 : 15;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, currentMaxLength);
    setPhoneState(prev => ({ ...prev, phone: val }));
  };

  const handleNifInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 9);
  };

  const fullPhoneSubmission = `+${phoneState.dial}${phoneState.phone}`;


  async function handleSubmit(formData: FormData) {
    setLoading(true);
    // Inject full phone manually since we use custom state
    formData.set("phone", fullPhoneSubmission);
    
    const res = await createOfflineClientAction(formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente criado com sucesso!");
      setIsOpen(false);
      // Reset State
      setPhoneState({ iso2: 'pt', dial: '351', phone: '' });
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    setPhoneState({ iso2: 'pt', dial: '351', phone: '' });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-md flex items-center gap-2"
      >
        <span>+</span> Criar Novo Cliente
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Registar Novo Cliente
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Use esta opção para adicionar clientes manualmente (ex: telefone ou presencial).
            </p>

            <form action={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  name="name" 
                  required 
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: Maria dos Santos" 
                />
              </div>

              {/* PHONE INPUT (Custom) */}
              <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Telemóvel *</label>
                 <div
                    className={`mt-1 relative ${isDropdownOpen ? 'z-20' : 'z-0'}`}
                    ref={dropdownRef}
                  >
                    <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 h-[40px]">
                      {/* Flag Button */}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 pl-3 pr-2 h-full hover:bg-gray-100 transition border-r-0 outline-none flex-shrink-0"
                      >
                        <FlagImage iso2={phoneState.iso2} size="24px" />
                        <span className="text-gray-600 font-medium text-sm">+{phoneState.dial}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <div className="h-6 w-px bg-gray-300 mx-1 flex-shrink-0"></div>

                      <input
                        type="tel"
                        required
                        value={phoneState.phone}
                        onChange={handlePhoneChange}
                        placeholder="912345678"
                         // We don't use 'name' here because we inject fullPhone manually
                        className="flex-1 h-full border-none outline-none focus:ring-0 text-gray-900 text-sm bg-transparent pl-2 min-w-0"
                      />
                    </div>

                    {/* Country Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute top-12 left-0 w-full min-w-[300px] max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
                        <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              ref={searchInputRef}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-500"
                              placeholder="Procurar país..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto">
                          {filteredCountries.map((country: any) => {
                              const parsed = parseCountry(country);
                              return (
                                <button
                                  key={parsed.iso2}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-purple-50 transition border-b border-gray-50 last:border-0"
                                >
                                  <FlagImage iso2={parsed.iso2} size="20px" />
                                  <span className="text-sm text-gray-700 font-medium">{parsed.name}</span>
                                  <span className="text-sm text-gray-400 ml-auto">+{parsed.dialCode}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
              </div>

               {/* NIF */}
               <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">NIF (Opcional)</label>
                <input 
                  name="nif" 
                  minLength={9}
                  maxLength={9}
                  onInput={handleNifInput}
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="123456789" 
                />
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Código Amigo (Opcional)</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-500">🎁</span>
                    <input 
                    name="referralCode" 
                    className="w-full border p-2 pl-9 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none uppercase tracking-widest placeholder:tracking-normal" 
                    placeholder="JOAO1234" 
                    />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email (Opcional)
                </label>
                <input 
                  name="email" 
                  type="email"
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: maria@email.com" 
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas Internas</label>
                <textarea 
                  name="notes" 
                  rows={2}
                  className="w-full border p-2 rounded bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="Ex: Cliente prefere ser contactada de manhã." 
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 font-bold"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 disabled:opacity-70"
                >
                  {loading ? "A Criar..." : "Registar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
