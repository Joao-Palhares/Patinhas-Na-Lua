import { db } from "@/lib/db";
// Reuse actions from schedule, or should I create new ones? Reusing is fine if paths are correct.
// However, revalidatePath in actions points to "/admin/settings/schedule". 
// It needs to ALSO revalidate "/admin/vacations" OR I should update the action to revalidate generic or specific.
// I will create NEW actions for this file that revalidate THIS page, OR update the old one.
// Let's import for now, but I might need to update actions.ts to revalidate both.
import { addAbsence, deleteAbsence } from "@/app/admin/settings/schedule/actions";

export default async function VacationsPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const absences = await db.$queryRaw<any[]>`
      SELECT "id", "startDate", "endDate", "reason" 
      FROM "Absence" 
      WHERE "endDate" >= ${today} 
      ORDER BY "startDate" ASC
    `;

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">🏖️ Férias e Ausências</h1>

            {/* Add Form */}
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-lg mb-8">
                <h3 className="text-sm font-bold text-blue-800 uppercase mb-4">Adicionar Nova Ausência</h3>
                <form action={addAbsence} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Início</label>
                            <input name="startDate" type="date" required className="w-full border p-3 rounded-lg text-gray-900 bg-gray-50" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Fim</label>
                            <input name="endDate" type="date" required className="w-full border p-3 rounded-lg text-gray-900 bg-gray-50" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Motivo</label>
                        <input name="reason" placeholder="Ex: Férias de Verão, Consulta Médica..." className="w-full border p-3 rounded-lg text-gray-900 bg-gray-50" />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition transform hover:scale-[1.01]">
                        Marcar Ausência
                    </button>
                    <p className="text-xs text-center text-gray-400">Estas datas ficarão bloqueadas para agendamentos.</p>
                </form>
            </div>

            {/* List */}
            <h3 className="text-lg font-bold text-gray-700 mb-4">Próximas Ausências</h3>
            <div className="space-y-4">
                {absences.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400">Nenhuma ausência marcada.</p>
                    </div>
                )}

                {absences.map(abs => (
                    <div key={abs.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-blue-200 transition">
                        <div>
                            <p className="font-bold text-gray-800 text-lg">{abs.reason || "Ausência"}</p>
                            <p className="text-sm text-gray-500 font-mono">
                                📅 {abs.startDate.toLocaleDateString('pt-PT')} <span className="text-gray-300">➜</span> {abs.endDate.toLocaleDateString('pt-PT')}
                            </p>
                        </div>
                        <form action={deleteAbsence}>
                            <input type="hidden" name="id" value={abs.id} />
                            <button className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition">
                                Remover
                            </button>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    );
}
