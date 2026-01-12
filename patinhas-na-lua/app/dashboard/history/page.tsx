import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReviewModal from "./review-modal";

export default async function HistoryPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // Fetch ALL appointments (Past & Future, but mainly focused on Past)
  const appointments = await db.appointment.findMany({
    where: {
      userId: user.id
    },
    include: {
      service: true,
      pet: true,
      review: true // Include review to check if exists
    },
    orderBy: { date: "desc" } // Newest first
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-800">Histórico de Visitas 📜</h1>
          <Link href="/dashboard">
            <button className="text-sm font-bold text-gray-500 hover:text-gray-800">
              ← Voltar
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>Ainda não tens histórico de agendamentos.</p>
              <Link href="/dashboard/book" className="text-blue-600 font-bold hover:underline mt-2 block">
                Fazer o primeiro agendamento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((app) => {
                const isPast = new Date(app.date) < new Date();
                const isCompleted = app.status === "COMPLETED";
                const isCancelled = app.status === "CANCELLED";

                let statusBadge = (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                    Agendado
                  </span>
                );

                if (isCancelled) {
                    statusBadge = (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                          Cancelado
                        </span>
                    );
                } else if (isCompleted) {
                    statusBadge = (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                          Concluído
                        </span>
                    );
                }

                return (
                  <div key={app.id} className="p-6 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    <div className="flex items-center gap-4">
                      {/* DATE BOX */}
                      <div className={`p-3 rounded-lg text-center min-w-[60px] ${isPast ? 'bg-gray-100' : 'bg-blue-50'}`}>
                        <span className={`block text-xl font-bold ${isPast ? 'text-gray-600' : 'text-blue-600'}`}>
                          {app.date.getDate()}
                        </span>
                        <span className="block text-xs uppercase font-bold text-gray-400">
                          {format(app.date, "MMM", { locale: pt })}
                        </span>
                      </div>

                      {/* DETAILS */}
                      <div>
                        <h3 className="font-bold text-gray-800">{app.service.name}</h3>
                        <p className="text-sm text-gray-500">
                          {app.pet.name} • {format(app.date, "HH:mm")}
                        </p>
                        <div className="mt-1">
                            {statusBadge}
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    {/* ACTIONS */}
                    <div className="flex flex-col items-end gap-2">
                         <span className="font-bold text-gray-800">
                            {Number(app.price).toFixed(2)}€
                         </span>

                         {/* REVIEW BUTTON (If Completed & Not Reviewed) */}
                         {isCompleted && !(app as any).review && (
                            <ReviewModal appointmentId={app.id} />
                         )}
                         
                         {/* Show Rebook Button only if Past or Cancelled */}
                         {(isPast || isCancelled) && (
                             <Link href={`/dashboard/book?petId=${app.petId}&serviceId=${app.serviceId}`}>
                                <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-bold hover:bg-black transition flex items-center gap-1">
                                    <span>↺</span> Reagendar
                                </button>
                             </Link>
                         )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
