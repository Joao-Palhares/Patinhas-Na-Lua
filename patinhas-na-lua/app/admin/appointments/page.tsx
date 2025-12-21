import { db } from "@/lib/db";
import NewAppointmentModal from "./new-appointment-modal";
import DeleteForm from "../components/delete-form"; // Use the one we made earlier
import { updateAppointmentStatus, deleteAppointment } from "./actions";

// Portuguese formatting for dates
const formatDate = (date: Date) => date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

export default async function AppointmentsPage(props: { 
  searchParams: Promise<{ date?: string }> 
}) {
  const searchParams = await props.searchParams;
  
  // 1. Determine Date (Default to Today)
  const dateParam = searchParams?.date;
  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  
  // Set time to 00:00 and 23:59 for Database Filtering
  const startOfDay = new Date(selectedDate); startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(selectedDate); endOfDay.setHours(23,59,59,999);

  // 2. Fetch Data
  const appointments = await db.appointment.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay }
    },
    include: { user: true, pet: true, service: true },
    orderBy: { date: "asc" }
  });

  // Fetch Users & Services for the "Create Modal"
  const clients = await db.user.findMany({ include: { pets: true }, orderBy: { name: "asc" } });
  const services = await db.service.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agenda Diária</h1>
          <p className="text-gray-500 capitalize">{formatDate(selectedDate)}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <form className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <input 
              name="date" 
              type="date" 
              defaultValue={selectedDate.toISOString().split('T')[0]} 
              className="outline-none text-gray-700 font-medium"
            />
            <button className="bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm font-bold">Ir</button>
          </form>

          {/* New Appointment Button */}
          <NewAppointmentModal clients={clients} services={services} />
        </div>
      </div>

      {/* APPOINTMENTS LIST */}
      <div className="space-y-4">
        {appointments.map(app => (
          <div key={app.id} className={`flex flex-col md:flex-row items-center bg-white border-l-4 rounded-r-xl shadow-sm p-4 gap-4 ${
            app.status === 'CONFIRMED' ? 'border-l-blue-500' :
            app.status === 'COMPLETED' ? 'border-l-green-500' :
            app.status === 'CANCELLED' ? 'border-l-red-500' : 'border-l-gray-300'
          }`}>
            
            {/* TIME */}
            <div className="text-center min-w-[80px]">
              <p className="text-xl font-bold text-gray-800">
                {app.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                app.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
              }`}>
                {app.isPaid ? 'PAGO' : 'POR PAGAR'}
              </span>
            </div>

            {/* DETAILS */}
            <div className="flex-1 w-full text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-800">{app.pet.name} <span className="text-sm font-normal text-gray-500">({app.user.name})</span></h3>
              <p className="text-blue-600 font-medium">{app.service.name}</p>
              <p className="text-sm text-gray-500">{Number(app.price).toFixed(2)}€</p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center">
              
              {/* Status Update Form */}
              <form action={updateAppointmentStatus} className="flex gap-2">
                <input type="hidden" name="id" value={app.id} />
                
                {app.status !== 'COMPLETED' && (
                  <button name="status" value="COMPLETED" className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded text-xs font-bold border border-green-200">
                    Concluir
                  </button>
                )}
                
                {!app.isPaid && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    <input type="checkbox" name="isPaid" value="true" onChange={(e) => e.target.form?.requestSubmit()} className="cursor-pointer" />
                    <span className="text-xs font-bold text-yellow-700">Pagar</span>
                  </div>
                )}
              </form>

              {/* Delete Button */}
              <DeleteForm id={app.id} action={deleteAppointment} className="text-gray-400 hover:text-red-500 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </DeleteForm>
            </div>

          </div>
        ))}

        {appointments.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Sem agendamentos para este dia.</p>
            <p className="text-sm text-gray-400">Use o botão + para adicionar manualmente.</p>
          </div>
        )}
      </div>

    </div>
  );
}