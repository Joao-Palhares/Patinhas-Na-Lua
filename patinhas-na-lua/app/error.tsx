"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (e.g., Sentry)
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">😿</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Ups! Algo correu mal
        </h1>
        
        <p className="text-gray-500 mb-6">
          Pedimos desculpa pelo incómodo. Ocorreu um erro inesperado.
        </p>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-2 rounded">
            ID do Erro: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Tentar Novamente
          </button>
          
          <Link href="/">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition w-full">
              Voltar ao Início
            </button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Se o problema persistir, contacte-nos.
        </p>
      </div>
    </div>
  );
}
