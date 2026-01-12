"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer"; 
import { InvoiceDocument } from "./invoice-document"; // Make sure the filename matches!
import { toast } from "sonner"; // + Import

interface Props {
  invoice: any; 
}

// --- VISUAL TRANSLATION MAPS ---
const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitida",
  PAID: "Paga",
  CANCELLED: "Anulada"
};

const SPECIES_MAP: Record<string, string> = {
  DOG: "Cão",
  CAT: "Gato",
  RABBIT: "Coelho",
  OTHER: "Outro"
};

const SIZE_LABELS: Record<string, string> = {
  TOY: "< 5kg",
  SMALL: "5-10kg",
  MEDIUM: "11-20kg",
  LARGE: "21-30kg",
  XL: "31-40kg",
  GIANT: "> 40kg",
};

const COAT_LABELS: Record<string, string> = {
  SHORT: "Curto",
  MEDIUM: "Médio",
  LONG: "Comprido",
  DOUBLE: "Duplo"
};

export default function InvoiceModal({ invoice }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // --- HANDLER: GENERATE NATIVE PDF ---
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // Generate the PDF blob using the dedicated document component
      const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fatura-${invoice.invoiceNumber || "Rascunho"}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erro ao gerar PDF.", { description: "Tente novamente mais tarde." });
    } finally {
      setIsDownloading(false);
    }
  };

  const pet = invoice.appointment.pet;
  const service = invoice.appointment.service;
  const fees = invoice.appointment.extraFees || [];

  const extrasTotal = fees.reduce((acc: number, curr: any) => acc + Number(curr.appliedPrice), 0);
  const servicePrice = Number(invoice.totalAmount) - extrasTotal;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 text-xs font-bold underline px-2"
      >
        Ver Fatura
      </button>

      {isOpen && (
        // BACKDROP
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          
          {/* MODAL CONTAINER - FIXED HEIGHT */}
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-xl flex flex-col relative max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* CLOSE BUTTON (X) */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full p-1.5 transition z-20 border border-gray-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* === SCROLLABLE VISUAL CONTENT === */}
            <div className="flex flex-col flex-1 overflow-hidden h-full">
              
              {/* --- HEADER --- */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-none flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-serif text-gray-900 font-bold tracking-tight">Patinhas na Lua</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Estética Animal</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-gray-900">{invoice.invoiceNumber || "RASCUNHO"}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{new Date(invoice.date).toLocaleDateString('pt-PT')}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    invoice.status === 'ISSUED' || invoice.status === 'PAID' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {STATUS_MAP[invoice.status] || invoice.status}
                  </span>
                </div>
              </div>

              {/* --- SCROLLABLE BODY --- */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                {/* CLIENT CARD */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-gray-900">{invoice.user.name}</p>
                      <p className="text-xs text-gray-500">{invoice.user.email}</p>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <p className="max-w-[150px] truncate">{invoice.user.address || "Sem morada"}</p>
                      <p className="mt-0.5 font-medium text-gray-900">NIF: {invoice.user.nif || "Final"}</p>
                    </div>
                  </div>
                </div>

                {/* SERVICES */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider px-1">Serviços</h3>
                  
                  {/* Service Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-sm text-gray-900">{service.name}</span>
                      </div>

                      <ul className="space-y-1 ml-0.5">
                        <li className="text-[11px] text-gray-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="font-semibold text-gray-700">Pet:</span> {pet.name} ({SPECIES_MAP[pet.species]})
                        </li>
                        <li className="text-[11px] text-gray-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="font-semibold text-gray-700">Peso:</span> {SIZE_LABELS[pet.sizeCategory]}
                        </li>
                        {pet.coatType && (
                           <li className="text-[11px] text-gray-600 flex items-center gap-1.5">
                             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                             <span className="font-semibold text-gray-700">Pelo: </span> {COAT_LABELS[pet.coatType]}
                           </li>
                        )}
                      </ul>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{servicePrice.toFixed(2)}€</div>
                  </div>

                  {/* Extra Fees Cards - Orange */}
                  {fees.map((fee: any) => (
                    <div key={fee.id} className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                          <span className="text-orange-700 text-[10px] font-bold uppercase tracking-wider bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">Extra</span>
                          <span className="text-xs font-medium text-gray-800">{fee.extraFee.name}</span>
                      </div>
                      <span className="font-bold text-gray-800 text-xs">{Number(fee.appliedPrice).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                {/* TOTALS SUMMARY */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mt-auto">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span>{Number(invoice.subtotal).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Impostos</span>
                      <span>0.00€</span>
                    </div>
                    <div className="my-2 border-t border-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total a Pagar</span>
                        <div className="text-[10px] text-gray-500">Via {invoice.appointment.paymentMethod}</div>
                      </div>
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {Number(invoice.totalAmount).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div> 

            {/* --- FOOTER BUTTONS --- */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center flex-none">
            
              {/* Left: Close */}
              <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-xs font-bold text-gray-400 hover:text-gray-900 transition px-2"
              >
                  Fechar
              </button>

              {/* Right: Actions */}
              <div>
                  <button 
                    onClick={handleDownloadPdf} 
                    disabled={isDownloading}
                    // FIX: Added '!' to bg-black and text-white. 
                    // This forces the color and ignores any parent CSS or hover defaults.
                    className="flex items-center gap-2 px-4 py-2 text-gray-900 !border-0 rounded-lg text-xs font-bold shadow-md disabled:opacity-70"
                  >
                    {isDownloading ? (
                      <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    {isDownloading ? "Gerando..." : "Download PDF"}
                  </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}