"use client";

import { completeOnboarding } from "@/app/actions";
import { useState, useRef, useEffect, useMemo, useActionState } from "react";
import Link from "next/link";
import { defaultCountries, FlagImage, parseCountry } from 'react-international-phone';
import { ChevronDown, Search, AlertCircle } from "lucide-react";

export default function OnboardingForm({
  defaultName
}: {
  defaultName: string
}) {

  /* --- CUSTOM PHONE INPUT COMPONENT --- */

  const [phoneState, setPhoneState] = useState({ iso2: 'pt', dial: '351', phone: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use useActionState for form submission handling
  const [state, formAction, isPending] = useActionState(completeOnboarding, null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery(""); // Reset search on close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleCountrySelect = (country: any) => {
    const parsed = parseCountry(country);
    // country is array [name, iso2, dial]
    setPhoneState(prev => ({ ...prev, iso2: parsed.iso2, dial: parsed.dialCode }));
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    // Allow only numbers
    const val = e.target.value.replace(/[^0-9]/g, "");
    setPhoneState(prev => ({ ...prev, phone: val }));
  };

  // Filter countries
  const filteredCountries = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return defaultCountries.filter((c: any) => {
      const parsed = parseCountry(c);
      return parsed.name.toLowerCase().includes(lower) || parsed.dialCode.includes(lower);
    });
  }, [searchQuery, defaultCountries]);

  // Dynamic Max Length enforcement
  // PT=9, BR=11, others=15 (E.164 max)
  const currentMaxLength = phoneState.iso2 === 'pt' ? 9 : phoneState.iso2 === 'br' ? 11 : 15;

  const fullPhoneSubmission = `+${phoneState.dial}${phoneState.phone}`;

  // Find current country data
  const currentCountryData = defaultCountries.find(c => parseCountry(c).iso2 === phoneState.iso2) || defaultCountries[0];
  // Unused: const parsedCurrent = parseCountry(currentCountryData);

  // Custom constraint validation
  const handleNifInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  const handleCustomPhoneInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const len = phoneState.phone.length;
    // Validate against the dynamic max length or a range
    if (len < (currentMaxLength === 15 ? 7 : currentMaxLength) || len > currentMaxLength) {
      target.setCustomValidity(`Número inválido para +${phoneState.dial} (esperados ${currentMaxLength} dígitos).`);
    }
  };

  const handleInvalidNif = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.validity.patternMismatch || target.validity.valueMissing) {
      target.setCustomValidity("NIF inválido. Deve ter 9 dígitos.");
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      {/* ERROR MESSAGE */}
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* NOME */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
        <input
          name="name"
          required
          defaultValue={state?.payload?.name || defaultName}
          className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telemóvel *</label>

          {/* Custom Styled Phone Input Refactored for Overlap Safety */}
          <div
            className={`mt-1 relative ${isDropdownOpen ? 'z-20' : 'z-0'}`}
            ref={dropdownRef}
          >
            {/* Visual Input Container - overflow-hidden ensures input doesn't bleed out */}
            <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 h-[44px]">
              {/* Left Button with Flag & Code */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-3 pr-2 h-full hover:bg-gray-50 transition border-r-0 outline-none flex-shrink-0"
              >
                <FlagImage iso2={phoneState.iso2} size="24px" />
                <span className="text-gray-600 font-medium text-sm">+{phoneState.dial}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 mx-1 flex-shrink-0"></div>

              {/* Input Field */}
              <input
                type="tel"
                id="phone" // Add explicit ID
                required
                value={phoneState.phone}
                onChange={handlePhoneChange}
                onInvalid={handleCustomPhoneInvalid}
                placeholder="912345678"
                className="flex-1 h-full border-none outline-none focus:ring-0 text-gray-900 text-base placeholder:text-gray-400 pl-2 min-w-0" // min-w-0 allows flex shrink
                maxLength={currentMaxLength}
              />
            </div>

            {/* Custom Dropdown - Sibling to input container, so it floats freely */}
            {isDropdownOpen && (
              <div className="absolute top-12 left-0 w-full min-w-[300px] max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
                {/* Search Bar */}
                <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Procurar país..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country: any) => {
                      const parsed = parseCountry(country);
                      const isSelected = parsed.iso2 === phoneState.iso2;
                      return (
                        <button
                          key={parsed.iso2}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50/50' : ''}`}
                        >
                          <FlagImage iso2={parsed.iso2} size="20px" />
                          <span className="text-sm text-gray-700 font-medium">{parsed.name}</span>
                          <span className="text-sm text-gray-400 ml-auto">+{parsed.dialCode}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">

                      País não encontrado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <input type="hidden" name="phone" value={fullPhoneSubmission} />
        </div>
        {/* NIF */}
        <div className="relative z-0">
          <label htmlFor="nif" className="block text-sm font-medium text-gray-700">NIF *</label>
          <input
            id="nif"
            name="nif"
            required
            type="tel"
            maxLength={9}
            minLength={9}
            pattern="[0-9]{9}"
            placeholder="123456789"
            defaultValue={state?.payload?.nif || ""}
            onInput={handleNifInput}
            onInvalid={handleInvalidNif}
            className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* MORADA */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Morada *</label>
        <textarea
          name="address"
          required
          rows={2}
          defaultValue={state?.payload?.address || ""}
          className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* REFERRAL CODE (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Código de Convite (Opcional)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-500">
            🎁
          </span>
          <input
            name="referralCode"
            placeholder="Ex: JOAO1234"
            defaultValue={state?.payload?.referralCode || ""}
            className={`w-full border rounded-lg p-2.5 pl-10 mt-1 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase tracking-widest placeholder:tracking-normal ${state?.error && state.error.includes("código") ? "border-red-500 bg-red-50" : "border-gray-300"}`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Se um amigo te recomendou, insere o código dele para ganhares 5% de desconto.</p>
      </div>

      <div className="flex items-start gap-3 py-2">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
          Li e aceito os <Link href="/terms" target="_blank" className="text-blue-600 underline hover:text-blue-800">Termos e Condições</Link> e a <Link href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-800">Política de Privacidade</Link>.
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
      >
        {isPending ? "A processar..." : "Concluir Registo"}
      </button>
    </form>
  );
}