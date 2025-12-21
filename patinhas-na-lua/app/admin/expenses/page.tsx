import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ExpenseCategory } from "@prisma/client";
import DeleteForm from "../components/delete-form";

// Portuguese Labels for Categories
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  PRODUCT: "Produtos (Shampoos, etc)",
  EQUIPMENT: "Equipamento (Tesouras, Mesas)",
  UTILITIES: "Contas (Luz, Água, Net)",
  RENT: "Renda",
  TAXES: "Impostos/Finanças",
  OTHER: "Outros",
};

export default async function ExpensesPage() {
  
  // Fetch expenses ordered by newest first
  const expenses = await db.expense.findMany({
    orderBy: { date: "desc" }
  });

  // Calculate Total
  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // --- ACTIONS ---
  async function createExpense(formData: FormData) {
    "use server";
    const description = formData.get("description") as string;
    const amount = Number(formData.get("amount"));
    const category = formData.get("category") as ExpenseCategory;
    const notes = formData.get("notes") as string;
    
    // Default to today if date is not picked? Or let user pick.
    // Let's assume 'now' for simplicity, or add a date picker later.
    
    await db.expense.create({
      data: { description, amount, category, notes }
    });
    revalidatePath("/admin/expenses");
  }

  async function deleteExpense(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.expense.delete({ where: { id } });
    revalidatePath("/admin/expenses");
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Gestão de Custos</h1>
        <div className="bg-red-50 px-6 py-3 rounded-xl border border-red-100">
          <span className="text-red-500 text-sm font-bold uppercase block">Total Gasto</span>
          <span className="text-3xl font-bold text-red-700">{totalSpent.toFixed(2)}€</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: FORM */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Registrar Despesa</h2>
          <form action={createExpense} className="flex flex-col gap-4">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
              <input 
                name="description" 
                required 
                placeholder="ex: 5L Shampoo Lavanda" 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">Valor (€)</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00" 
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
              <select 
                name="category" 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(ExpenseCategory).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Notas (Opcional)</label>
              <textarea 
                name="notes" 
                rows={2} 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <button className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition w-full shadow-md mt-2">
              Adicionar Despesa
            </button>
          </form>
        </div>

        {/* RIGHT: LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Histórico</h2>
          
          {expenses.length === 0 ? (
            <p className="text-gray-500 italic">Nenhuma despesa registrada.</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{expense.description}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                      {CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {expense.date.toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  {expense.notes && <p className="text-sm text-gray-500 mt-2">{expense.notes}</p>}
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">-{Number(expense.amount).toFixed(2)}€</p>
                  {/* --- SAFE DELETE EXPENSE BUTTON --- */}
                    <DeleteForm 
                        id={expense.id} 
                        action={deleteExpense}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline mt-1"
                    >
                        Apagar
                    </DeleteForm>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}