import { db } from "@/lib/db";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { revalidatePath } from "next/cache";

// ACTION to Toggle Blacklist & Notes
async function updateUserStatus(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const isBlacklisted = formData.get("isBlacklisted") === "on";
  const notes = formData.get("notes") as string;

  await db.user.update({
    where: { id: userId },
    data: { isBlacklisted, notes }
  });

  revalidatePath("/admin/invoices/unpaid");
}

export default async function UnpaidInvoicesPage() {
  
  // FETCH UNPAID COMPLETED APPOINTMENTS
  const unpaidAppointments = await db.appointment.findMany({
    where: {
      status: "COMPLETED",
      isPaid: false
    },
    include: {
      user: true,
      service: true,
      pet: true
    },
    orderBy: { date: "asc" } // Oldest debts first
  });

  // Calculate Total Debt
  const totalDebt = unpaidAppointments.reduce((acc, app) => acc + Number(app.price), 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-red-600">Por Pagar ⚠️</h1>
          <p className="text-gray-500">Lista de clientes com serviços concluídos mas não pagos.</p>
        </div>
        <div className="bg-red-50 px-6 py-3 rounded-xl text-right">
          <p className="text-xs font-bold text-red-400 uppercase">Total em Dívida</p>
          <p className="text-3xl font-black text-red-600">{totalDebt.toFixed(2)}€</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {unpaidAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h3 className="text-xl font-bold text-green-700">Tudo em dia!</h3>
            <p className="text-gray-400">Não existem clientes com dívidas pendentes.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {unpaidAppointments.map(app => (
              <div key={app.id} className="p-6 hover:bg-red-50/10 transition flex flex-col lg:flex-row gap-6">
                
                {/* APPOINTMENT INFO */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                        {format(app.date, "dd MMM yyyy", { locale: pt })}
                     </span>
                     <span className="text-gray-400 text-xs"> há {Math.floor((Date.now() - app.date.getTime()) / (1000 * 60 * 60 * 24))} dias</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{app.user.name}</h3>
                  <p className="text-sm text-gray-500">Pet: {app.pet.name} • {app.service.name}</p>
                  <p className="text-xl font-black text-gray-800 mt-2">{Number(app.price).toFixed(2)}€</p>
                  
                  {/* Link to Payment */}
                  <div className="mt-3">
                     <Link href={`/admin/appointments?highlight=${app.id}`}>
                        <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-black transition">
                           Ir para Pagamento →
                        </button>
                     </Link>
                  </div>
                </div>

                {/* USER MANAGEMENT (Notes & Blacklist) */}
                <div className="w-full lg:w-96 bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <form action={updateUserStatus} className="space-y-3">
                      <input type="hidden" name="userId" value={app.userId} />
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas do Cliente</label>
                        <textarea 
                          name="notes" 
                          defaultValue={app.user.notes || ""} 
                          placeholder="Ex: Disse que pagava amanhã..." 
                          className="w-full text-sm p-2 rounded border border-gray-300 h-20 text-gray-800"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="isBlacklisted" 
                              defaultChecked={app.user.isBlacklisted} 
                              className="w-4 h-4 text-red-600 rounded focus:ring-red-500" 
                            />
                            <span className="text-xs font-bold text-red-700">⛔ Blacklist (Banir)</span>
                         </label>

                         <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold transition">
                            Guardar Nota
                         </button>
                      </div>
                   </form>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
