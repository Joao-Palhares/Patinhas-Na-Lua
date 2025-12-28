"use client";

import { updateAppointmentStatus } from "./actions";
import PaymentModal from "./payment-modal";

interface Props {
  id: string;
  status: string;
  isPaid: boolean;
  price: number; // Need price now
}

export default function AppointmentStatus({ id, status, isPaid, price }: Props) {
  return (
    <div className="flex items-center gap-2">
      
      {/* 1. STATUS BUTTON (Only marks as Completed) */}
      {status !== 'COMPLETED' && (
        <form action={updateAppointmentStatus}>
          <input type="hidden" name="id" value={id} />
          <button 
            name="status" 
            value="COMPLETED" 
            className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded text-xs font-bold border border-green-200 whitespace-nowrap"
          >
            Concluir Serviço
          </button>
        </form>
      )}
      
      {/* 2. PAYMENT BUTTON (Shows Modal) */}
      {!isPaid ? (
        <PaymentModal id={id} currentPrice={price} />
      ) : (
        <span className="text-xs font-bold text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded cursor-default">
          Pago ✅
        </span>
      )}

    </div>
  );
}