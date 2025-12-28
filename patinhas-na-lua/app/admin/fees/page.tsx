import { db } from "@/lib/db";
import { createFee, deleteFee } from "./actions";
import DeleteForm from "../components/delete-form"; // Reusing your delete button

export default async function FeesPage() {
  
  // Fetch existing fees (Decimal -> Number conversion)
  const rawFees = await db.extraFee.findMany({ orderBy: { name: 'asc' } });
  const fees = rawFees.map(f => ({ ...f, basePrice: f.basePrice.toNumber() }));

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Taxas e Extras</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CREATE FORM */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Criar Nova Taxa</h2>
          <form action={createFee} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Taxa</label>
              <input 
                name="name" 
                required 
                placeholder="Ex: Taxa de Nós" 
                className="w-full border p-2.5 rounded-lg text-gray-900 bg-white border-gray-300" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Valor Base (€)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                required 
                placeholder="10.00" 
                className="w-full border p-2.5 rounded-lg text-gray-900 bg-white border-gray-300" 
              />
            </div>
            <button className="bg-blue-600 text-white font-bold w-full py-2.5 rounded-lg hover:bg-blue-700">
              Criar
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {fees.map(fee => (
            <div key={fee.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{fee.name}</h3>
                <p className="text-sm text-gray-500">Valor Sugerido: {fee.basePrice.toFixed(2)}€</p>
              </div>
              <DeleteForm id={fee.id} action={deleteFee} className="text-red-500 hover:bg-red-50 p-2 rounded font-bold text-xs">
                Apagar
              </DeleteForm>
            </div>
          ))}
          {fees.length === 0 && (
            <div className="text-center text-gray-400 py-10 bg-slate-50 rounded-xl border border-dashed">
              Sem taxas criadas.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}