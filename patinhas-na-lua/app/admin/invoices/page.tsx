import { db } from "@/lib/db";
import InvoiceModal from "./invoice-modal";

export default async function InvoicesPage() {

  // 1. Fetch all Issued invoices with nested relations
  const rawInvoices = await db.invoice.findMany({
    where: {
      status: { in: ["ISSUED", "PAID"] }
    },
    include: {
      user: true,
      appointment: {
        include: {
          pet: true,
          service: true,
          extraFees: { include: { extraFee: true } }
        }
      }
    },
    orderBy: { date: "desc" }
  });

  // 2. CRITICAL FIX: Deep Convert all Decimals to Numbers
  const invoices = rawInvoices.map(inv => ({
    ...inv,
    // Convert Invoice Decimals
    subtotal: inv.subtotal.toNumber(),
    taxAmount: inv.taxAmount.toNumber(),
    totalAmount: inv.totalAmount.toNumber(),

    // Deep Clean Appointment
    appointment: {
      ...inv.appointment,
      price: inv.appointment.price.toNumber(),
      travelFee: (inv.appointment as any).travelFee?.toNumber() || 0,
      originalPrice: inv.appointment.originalPrice ? inv.appointment.originalPrice.toNumber() : null,

      // Deep Clean Extra Fees
      extraFees: inv.appointment.extraFees.map(fee => ({
        ...fee,
        appliedPrice: fee.appliedPrice.toNumber(),
        extraFee: {
          ...fee.extraFee,
          basePrice: fee.extraFee.basePrice.toNumber()
        }
      }))
    }
  }));

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Faturas Emitidas</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-bold text-gray-600">Nº Fatura</th>
              <th className="p-4 font-bold text-gray-600">Data</th>
              <th className="p-4 font-bold text-gray-600">Cliente</th>
              <th className="p-4 font-bold text-gray-600">Total</th>
              <th className="p-4 font-bold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-mono font-bold text-blue-600">
                  {inv.invoiceNumber}
                </td>
                <td className="p-4 text-gray-600">
                  {new Date(inv.date).toLocaleDateString('pt-PT')}
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{inv.user.name}</div>
                  <div className="text-xs text-gray-400">NIF: {inv.user.nif || "N/A"}</div>
                </td>
                <td className="p-4 font-bold text-green-700 text-lg">
                  {inv.totalAmount.toFixed(2)}€
                </td>
                <td className="p-4 text-right">
                  <InvoiceModal invoice={inv} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 italic">
                  Ainda não foram emitidas faturas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}