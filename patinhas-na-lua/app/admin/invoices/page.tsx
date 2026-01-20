import { db } from "@/lib/db";
import InvoiceModal from "./invoice-modal";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {

  // 1. Fetch all invoices
  const rawInvoices = await db.invoice.findMany({
    include: {
      user: true, // For fallback if invoicedName is missing, though schema says it's required
    },
    orderBy: { date: "desc" }
  });

  // 2. Convert Decimals
  const invoices = rawInvoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.externalId || inv.invoiceNumber || "Rascunho",
    date: inv.date,
    invoicedName: inv.invoicedName || inv.user?.name || "Cliente Desconhecido",
    invoicedNif: inv.invoicedNif || inv.user?.nif || "N/A",
    totalAmount: inv.totalAmount.toNumber(),
    status: inv.status,
    pdfUrl: inv.pdfUrl
  }));

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
        case "ISSUED": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">Emitida</span>;
        case "DRAFT": return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold border border-gray-200">Rascunho</span>;
        case "CANCELLED": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold border border-red-200">Anulada</span>;
        case "PAID": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">Paga</span>;
        default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faturas</h1>
          <p className="text-slate-500 mt-1">Histórico de faturação e documentos.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Nº Fatura</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Cliente</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Data</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Total</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-blue-600">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{inv.invoicedName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">NIF: {inv.invoicedNif}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(inv.date).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {inv.totalAmount.toFixed(2)}€
                  </td>
                  <td className="p-4">
                    {getStatusBadge(inv.status)}
                  </td>
                  <td className="p-4 text-right">
                    <InvoiceModal invoice={inv} />
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 italic bg-slate-50">
                    Ainda não foram emitidas faturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}