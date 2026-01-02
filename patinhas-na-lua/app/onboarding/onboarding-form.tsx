"use client";

import { completeOnboarding } from "@/app/actions";
import { useState } from "react";

export default function OnboardingForm({
  defaultName
}: {
  defaultName: string
}) {

  // This small function deletes any non-number immediately
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Replace anything that is NOT a number (0-9) with empty string
    e.target.value = value.replace(/[^0-9]/g, "");
  };

  return (
    <form action={completeOnboarding} className="space-y-4">
      {/* NOME */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
        <input
          name="name"
          required
          defaultValue={defaultName}
          className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* TELEMOVEL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Telemóvel *</label>
          <input
            name="phone"
            required
            type="tel"
            maxLength={9}
            minLength={9}
            placeholder="912345678"
            onInput={handleNumberInput} // <--- This BLOCKS letters
            className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {/* NIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700">NIF *</label>
          <input
            name="nif"
            required
            type="tel"
            maxLength={9}
            minLength={9}
            placeholder="123456789"
            onInput={handleNumberInput} // <--- This BLOCKS letters
            className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 mt-1 text-gray-900 bg-white focus:ring-purple-500 focus:border-purple-500 uppercase tracking-widest placeholder:tracking-normal"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Se um amigo te recomendou, insere o código dele para ganhares 5% de desconto.</p>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
      >
        Concluir Registo
      </button>
    </form>
  );
}