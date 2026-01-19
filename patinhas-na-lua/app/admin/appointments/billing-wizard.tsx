"use client";

import { useState } from "react";
import { saveBillingDraft, updateClientNif, issueInvoice } from "@/app/admin/billing/actions";
import { PaymentMethod } from "@prisma/client";

interface Props {
  appointment: any;
  extraFeeOptions: any[];
}

export default function BillingWizard({ appointment, extraFeeOptions }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // HOURLY LOGIC
  const isTimeBased = (appointment.service as any).isTimeBased;
  const hourlyRate = Number(appointment.price);

  // Calculate default minutes if available
  const calculateDefaultMinutes = () => {
    if (appointment.actualStartTime && appointment.finishedAt) {
      const start = new Date(appointment.actualStartTime);
      const end = new Date(appointment.finishedAt);
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000 / 60));
    }
    return 60; // Default 1 hour
  };
  
  const [minutes, setMinutes] = useState(calculateDefaultMinutes());

  // Initial Price: If time based, calculate it. Else use booked price.
  const initialPrice = isTimeBased 
    ? (calculateDefaultMinutes() / 60) * hourlyRate 
    : Number(appointment.price);

  const [basePrice, setBasePrice] = useState(initialPrice);
  const [selectedFees, setSelectedFees] = useState<{ id: string; name: string; price: number }[]>(
    appointment.extraFees.map((ef: any) => ({
      id: ef.extraFee.id,
      name: ef.extraFee.name,
      price: Number(ef.appliedPrice)
    }))
  );
  const [notes, setNotes] = useState(appointment.groomerNotes || "");
  const [nif, setNif] = useState(appointment.user.nif || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const total = Number(basePrice) + selectedFees.reduce((acc, curr) => acc + Number(curr.price), 0);
  const isDraft = appointment.invoice?.status === "DRAFT";

  const handleAddFee = (feeId: string) => {
    const fee = extraFeeOptions.find(f => f.id === feeId);
    if (fee) {
      setSelectedFees([...selectedFees, { id: fee.id, name: fee.name, price: Number(fee.basePrice) }]);
    }
  };

  // COUPON STATE
  const [couponCode, setCouponCode] = useState("");
  const [analyzingCoupon, setAnalyzingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<{ valid: boolean; message?: string; discount?: number } | null>(null);

  const checkCoupon = async () => {
    setAnalyzingCoupon(true);
    setCouponResult(null);
    try {
      const { validateCoupon } = await import("@/app/dashboard/book/actions");
      const res = await validateCoupon(couponCode);

      if (res.valid) {
        setCouponResult({ valid: true, discount: res.discount });
        // Apply discount logic immediately? 
        // Logic: If 100%, set basePrice to 0? Or just subtract from total?
        // Prompt says "if he wants". So if valid, we AUTOMATICALLY apply it?
        // Let's adjust the base price or show it as a specific discount line item?
        // Simplest: If discount is 100% (Reward), set basePrice to 0.
        if (res.discount === 100) {
          setBasePrice(0);
        } else {
          // For percent off
          setBasePrice(prev => prev - (prev * ((res.discount || 0) / 100)));
        }
      } else {
        setCouponResult({ valid: false, message: res.message });
      }
    } catch (e) {
      setCouponResult({ valid: false, message: "Erro ao validar." });
    } finally {
      setAnalyzingCoupon(false);
    }
  };

  const handleRemoveFee = (index: number) => {
    const newFees = [...selectedFees];
    newFees.splice(index, 1);
    setSelectedFees(newFees);
  };

  const saveProgress = async () => {
    setLoading(true);
    await saveBillingDraft(
      appointment.id,
      Number(basePrice),
      selectedFees.map(f => ({ id: f.id, price: Number(f.price) })),
      notes
    );
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    if (nif !== appointment.user.nif) await updateClientNif(appointment.user.id, nif);
    await issueInvoice(appointment.id, paymentMethod);
    setLoading(false);
    setIsOpen(false);
  };

  if (appointment.status === "COMPLETED") return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition whitespace-nowrap
          ${isDraft
            ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
            : "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
          }`}
      >
        {isDraft ? "📝 Rascunho" : "✅ Finalizar"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Finalizar Serviço - {appointment.pet.name}</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                  <span key={s} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= s ? "bg-blue-500 text-white" : "bg-slate-700 text-gray-400"}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">

              {/* STEP 1: REVIEW */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Preço Base ({appointment.service.name})</label>
                      {isTimeBased && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 rounded">Rate: {hourlyRate}€/h</span>}
                    </div>

                    {isTimeBased && (
                      <div className="mb-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                        <label className="block text-xs font-bold text-yellow-700 mb-1">Tempo Gasto (Minutos)</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number"
                            value={minutes}
                            onChange={(e) => {
                              const m = Number(e.target.value);
                              setMinutes(m);
                              setBasePrice( (m / 60) * hourlyRate );
                            }}
                            className="w-24 border border-yellow-300 p-2 rounded font-bold text-center text-yellow-900"
                          />
                          <span className="text-sm text-yellow-600 font-bold">= {basePrice.toFixed(2)}€</span>
                        </div>
                        {appointment.actualStartTime && appointment.finishedAt && (
                          <p className="text-[10px] text-yellow-600 mt-1">Calculado via Cronómetro (Real)</p>
                        )}
                      </div>
                    )}

                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 p-3 rounded-lg font-black text-2xl text-gray-900 bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Taxas Extra</label>
                    <div className="flex gap-2 mb-3">
                      <select
                        id="feeSelect"
                        className="border-2 border-gray-300 p-2 rounded-lg text-sm flex-1 bg-white text-gray-900 font-medium"
                      >
                        <option value="">Selecionar Taxa...</option>
                        {extraFeeOptions.map((f: any) => <option key={f.id} value={f.id}>{f.name} (+{f.basePrice}€)</option>)}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById('feeSelect') as HTMLSelectElement;
                          if (select.value) handleAddFee(select.value);
                        }}
                        className="bg-blue-600 text-white px-4 rounded-lg font-bold text-lg hover:bg-blue-700"
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <span className="font-bold text-gray-700">{fee.name}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={fee.price}
                              onChange={(e) => {
                                const newFees = [...selectedFees];
                                newFees[idx].price = Number(e.target.value);
                                setSelectedFees(newFees);
                              }}
                              className="w-20 border border-gray-300 p-1 rounded text-right font-bold text-gray-900"
                            />
                            <button onClick={() => handleRemoveFee(idx)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COUPON SECTION */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <label className="block text-xs font-bold text-orange-700 uppercase mb-2">Aplicar Cupão / Voucher</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CODE-123"
                        className="flex-1 border-2 border-orange-200 p-2 rounded-lg text-sm bg-white font-mono uppercase"
                      />
                      <button
                        onClick={checkCoupon}
                        disabled={analyzingCoupon || !couponCode}
                        className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold"
                      >
                        {analyzingCoupon ? "..." : "Verificar"}
                      </button>
                    </div>
                    {couponResult && (
                      <div className={`mt-2 text-xs font-bold p-2 rounded ${couponResult.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {couponResult.message || (couponResult.discount === 100 ? "Oferta Total Aplicada!" : `Desconto de ${couponResult.discount}% Aplicado`)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas Internas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border-2 border-gray-300 p-3 rounded-lg h-24 bg-white text-gray-900 focus:border-blue-500 outline-none"
                      placeholder="Comportamento, observações..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: NIF */}
              {step === 2 && (
                <div className="text-center py-10">
                  <h4 className="text-xl font-bold text-gray-800 mb-6">Dados Fiscais</h4>
                  <div className="max-w-xs mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <label className="block text-left text-xs font-bold text-gray-500 mb-2 uppercase">NIF do Cliente</label>
                    <input
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      placeholder="999999990"
                      className="w-full border-2 border-blue-200 p-4 rounded-xl text-center text-3xl font-mono font-bold text-gray-900 tracking-widest bg-blue-50 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 && (
                <div className="text-center py-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-6">Método de Pagamento</h4>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 inline-block mb-8">
                    <div className="text-sm text-gray-500 font-bold uppercase mb-1">Total a Receber</div>
                    <div className="text-5xl font-black text-green-600 tracking-tight">{total.toFixed(2)}€</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {['CASH', 'MBWAY', 'CARD', 'TRANSFER'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m as PaymentMethod)}
                        className={`p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2
                          ${paymentMethod === m
                            ? "border-green-500 bg-green-50 text-green-800 shadow-md transform scale-105"
                            : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
                          }`}
                      >
                        <span className="text-2xl">{m === 'CASH' ? '💵' : m === 'MBWAY' ? '📱' : m === 'CARD' ? '💳' : '🏦'}</span>
                        <span>{m === 'CASH' ? 'Dinheiro' : m === 'MBWAY' ? 'MBWay' : m === 'CARD' ? 'Multibanco' : 'Transf.'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY */}
              {step === 4 && (
                <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300">
                  <h4 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Resumo Final</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Serviço Base</span>
                      <span className="font-mono font-bold">{basePrice.toFixed(2)}€</span>
                    </div>
                    {selectedFees.map((f, i) => (
                      <div key={i} className="flex justify-between text-gray-600">
                        <span>{f.name}</span>
                        <span className="font-mono font-bold">{f.price.toFixed(2)}€</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t font-black text-xl text-gray-900">
                      <span>TOTAL</span>
                      <span>{total.toFixed(2)}€</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t text-xs font-bold text-gray-500 flex justify-between uppercase">
                    <span>NIF: {nif || "Consumidor Final"}</span>
                    <span>Pagamento: {paymentMethod}</span>
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t bg-white flex justify-between items-center">
              {step === 1 ? (
                <button onClick={() => setIsOpen(false)} className="text-red-500 font-bold px-4 hover:bg-red-50 py-2 rounded">Cancelar</button>
              ) : (
                <button onClick={() => setStep(step - 1)} className="text-gray-600 font-bold px-4 hover:bg-gray-100 py-2 rounded">Voltar</button>
              )}

              {step < 4 ? (
                <button
                  onClick={async () => {
                    if (step === 1) await saveProgress();
                    setStep(step + 1);
                  }}
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg"
                >
                  {loading ? "A guardar..." : "Próximo →"}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition shadow-lg flex items-center gap-2"
                >
                  {loading ? "A emitir..." : "🧾 Emitir Fatura"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}