"use client";

import { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem("cookie_consent");
    if (stored === "true") setConsent(true);
    else if (stored === "false") setConsent(false);
  }, []);

  const handleAccept = () => {
    setConsent(true);
    localStorage.setItem("cookie_consent", "true");
  };

  const handleDecline = () => {
    setConsent(false);
    localStorage.setItem("cookie_consent", "false");
  };

  // If consent is already given, load GA. If denied, load nothing.
  if (consent === true) {
    return <GoogleAnalytics gaId="G-9GKJYX5MTZ" />;
  }

  // If user declined or hasn't chosen yet, do NOT load GA.
  // Only show banner if choice is null (not yet made)
  if (consent === false) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 shadow-lg border-t border-slate-700 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-300 text-center md:text-left">
          <p>
            Utilizamos cookies para melhorar a sua experiência e analisar o tráfego do site via Google Analytics.
            Ao continuar, concorda com a nossa política de privacidade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
