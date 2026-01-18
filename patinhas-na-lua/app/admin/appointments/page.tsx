import { db } from "@/lib/db";
import NewAppointmentModal from "./new-appointment-modal";
import DeleteForm from "../components/delete-form";
import { deleteAppointment } from "./actions";
import BillingWizard from "./billing-wizard";
import WhatsAppModal from "../components/whatsapp-modal";
import TestEmailButton from "../components/test-email-button";
import SendRemindersButton from "../components/send-reminders-button";
import AppointmentTimer from "./appointment-timer";

const formatDate = (date: Date) => date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

export default async function AppointmentsPage(props: {
  searchParams: Promise<{ date?: string }>
}) {
  const searchParams = await props.searchParams;

  const dateParam = searchParams?.date;
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);

  // 2. FETCH APPOINTMENTS (With Invoice & Extra Fees)
  const rawAppointments = await db.appointment.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay }
    },
    include: {
      user: true,
      pet: true,
      service: true,
      // INCLUDE NEW RELATIONS
      invoice: true,
      extraFees: { include: { extraFee: true } }
    },
    orderBy: { date: "asc" }
  });

  // 3. CONVERT APPOINTMENT DATA (Decimal -> Number)
  // This prevents the "Decimal object not supported" error in the Wizard
  const appointments = rawAppointments.map(app => ({
    ...app,
    price: app.price.toNumber(),
    originalPrice: app.originalPrice ? app.originalPrice.toNumber() : null,
    travelFee: app.travelFee.toNumber(),
    // Convert Invoice Decimals
    invoice: app.invoice ? {
      ...app.invoice,
      subtotal: app.invoice.subtotal.toNumber(),
      taxAmount: app.invoice.taxAmount.toNumber(),
      totalAmount: app.invoice.totalAmount.toNumber(),
    } : null,
    // Convert Extra Fee Decimals
    extraFees: app.extraFees.map(fee => ({
      ...fee,
      appliedPrice: fee.appliedPrice.toNumber(),
      extraFee: {
        ...fee.extraFee,
        basePrice: fee.extraFee.basePrice.toNumber()
      }
    }))
  }));

  // 4. FETCH EXTRA FEE OPTIONS (For the dropdown)
  const rawFees = await db.extraFee.findMany();
  const extraFeeOptions = rawFees.map(f => ({
    ...f,
    basePrice: f.basePrice.toNumber()
  }));

  // Fetch Clients & Services (For New Appointment Modal)
  const clients = await db.user.findMany({ include: { pets: true }, orderBy: { name: "asc" } });

  const rawServices = await db.service.findMany({
    include: { options: true },
    orderBy: { name: "asc" }
  });

  const services = rawServices.map(service => ({
    ...service,
    options: service.options.map(opt => ({
      ...opt,
      price: opt.price.toNumber()
    }))
  }));

  return (
    <div className="max-w-5xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agenda Diária</h1>
          <p className="text-gray-500 capitalize">{formatDate(selectedDate)}</p>
        </div>

        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <input
              name="date"
              type="date"
              defaultValue={selectedDate.toISOString().split('T')[0]}
              className="outline-none text-gray-700 font-medium"
            />
            <button className="bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm font-bold">Ir</button>
          </form>

          <NewAppointmentModal clients={clients} services={services} />
          <TestEmailButton />
          <SendRemindersButton />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {appointments.map(app => {

          // --- CALCULATE REAL TOTAL ---
          const extrasTotal = app.extraFees.reduce((acc, curr) => acc + curr.appliedPrice, 0);
          const totalValue = app.price + extrasTotal;

          return (
            <div key={app.id} className={`flex flex-col md:flex-row items-center bg-white border-l-4 rounded-r-xl shadow-sm p-4 gap-4 ${app.status === 'CONFIRMED' ? 'border-l-blue-500' :
              app.status === 'COMPLETED' ? 'border-l-green-500' :
                app.status === 'CANCELLED' ? 'border-l-red-500' : 'border-l-gray-300'
              }`}>

              {/* TIME */}
              <div className="text-center min-w-[80px]">
                <p className="text-xl font-bold text-gray-800">
                  {app.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {app.invoice?.status === 'DRAFT' && <span className="block text-[10px] font-bold text-orange-600 bg-orange-100 px-1 rounded mb-1">RASCUNHO</span>}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${app.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                  {app.isPaid ? 'PAGO' : 'POR PAGAR'}
                </span>
              </div>

              {/* DETAILS */}
              <div className="flex-1 w-full text-center md:text-left space-y-2">
                <div className="mb-1">
                  {app.status === "PENDING" && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase">⌛ Pendente</span>}
                  {app.status === "CONFIRMED" && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded border border-blue-200 uppercase">✅ Confirmado</span>}
                  {app.status === "CANCELLED" && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 uppercase">❌ Cancelado</span>}
                  {app.status === "COMPLETED" && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded border border-green-200 uppercase">🏁 Concluído</span>}
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  {app.pet.name} <span className="text-sm font-normal text-gray-500">({app.user.name})</span>
                </h3>

                {/* BADGES */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                    ✂️ {app.service.name} ({app.price.toFixed(2)}€)
                  </span>
                  {app.extraFees.map((fee) => (
                    <span key={fee.id} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-bold border border-orange-100">
                      ⚠️ {fee.extraFee.name} (+{fee.appliedPrice.toFixed(2)}€)
                    </span>
                  ))}

                  {/* TOTAL BADGE */}
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-100 shadow-sm">
                    💰 Total: {totalValue.toFixed(2)}€
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-center">

                {/* GOOGLE MAPS ROUTE (MOBILE) */}
                {app.locationType === 'MOBILE' && app.mobileAddress && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(app.mobileAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition"
                    title={`Iniciar Rota para: ${app.mobileAddress}`}
                  >
                    📍
                  </a>
                )}

                {/* TIMER (HOURLY SERVICES) */}
                <AppointmentTimer appointment={app as any} />

                {/* WHATSAPP BUTTON (QR CODE MODAL) */}
                <WhatsAppModal
                  phone={app.user.phone || ""}
                  clientName={app.user.name || "Cliente"}
                  petName={app.pet.name}
                  date={app.date}
                  serviceName={app.service.name}
                />

                <BillingWizard appointment={app} extraFeeOptions={extraFeeOptions} />
                <DeleteForm id={app.id} action={deleteAppointment} className="text-gray-400 hover:text-red-500 p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </DeleteForm>
              </div>

            </div>
          )
        })}

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