"use client";

import { useState } from "react";
import { Download, Eye, X, Loader2 } from "lucide-react";

interface Props {
  invoice: {
    invoiceNumber: string | null;
    pdfUrl: string | null;
    status: string;
  };
}

export default function InvoiceModal({ invoice }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!invoice.pdfUrl) {
    return (
      <button 
        disabled 
        className="text-gray-400 cursor-not-allowed px-2 flex items-center gap-1 opacity-50"
      >
        <Eye size={14} />
        <span className="text-xs font-bold">Ver</span>
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition"
      >
        <Eye size={14} />
        <span className="text-xs font-bold">Ver</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                📄 Fatura {invoice.invoiceNumber}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-900 bg-white border hover:bg-gray-100 p-1 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body (Iframe) */}
            <div className="flex-1 bg-gray-100 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-blue-600 bg-white">
                  <Loader2 className="animate-spin w-8 h-8" />
                </div>
              )}
              <iframe 
                src={`/api/proxy-pdf?url=${encodeURIComponent(invoice.pdfUrl)}`} 
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
                title={`Fatura ${invoice.invoiceNumber}`}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
              >
                Fechar
              </button>
              
              <a 
                href={`/api/proxy-pdf?url=${encodeURIComponent(invoice.pdfUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                download={`Fatura-${invoice.invoiceNumber}.pdf`}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-sm hover:shadow-md"
              >
                <Download size={16} />
                Download PDF
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}