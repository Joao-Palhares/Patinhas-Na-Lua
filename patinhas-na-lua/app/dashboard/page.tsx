import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "./cancel-button";

// 1. DEFINE THE MAPPING HERE
const SPECIES_ICON_MAP: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  RABBIT: "🐰",
  OTHER: "🐾"
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // 1. Fetch User Data (Pets & Appointments)
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      pets: true,
      appointments: {
        where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: { service: true, pet: true }
      }
    }
  });

  if (!dbUser) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 mt-8">

        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta! 👋</h2>
          <p className="opacity-90">Pronto para mimar o seu melhor amigo?</p>
          <div className="mt-6">
            <Link href="/dashboard/book">
              <button className="bg-white text-blue-600 font-bold py-3 px-6 rounded-lg shadow hover:bg-gray-100 transition">
                📅 Agendar Nova Visita
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* CARD 1: LOYALTY CARD (NEW) */}
          {/* CARD 1: LOYALTY CARD (NEW) */}
          <Link href="/dashboard/rewards">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden h-full group transition hover:shadow-md">
              {/* Decorative Bone - Moved to bottom right */}
              <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 transition rotate-12">
                <span className="text-9xl">🦴</span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">Clube Patinhas 🦴</h3>

              <div className="relative z-10 flex flex-col justify-center h-full min-h-[100px]">
                <p className="text-4xl font-black text-blue-600 mb-1">
                  {dbUser.loyaltyPoints} <span className="text-lg font-bold text-gray-400">Patinhas</span>
                </p>
                <p className="text-sm text-gray-500 font-medium">Troque as suas patinhas por ofertas!</p>

                <span className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-wider group-hover:underline">
                  Ver Prémios →
                </span>
              </div>
            </div>
          </Link>

          {/* CARD 2: REVIEW BOOSTER (NEW) */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl shadow-sm border border-yellow-100 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-2">⭐</span>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Gostou do serviço?</h3>
            <p className="text-sm text-gray-600 mb-4">A sua opinião ajuda-nos a crescer!</p>
            <a
              href="https://www.google.com/maps/place/Patinhas+na+Lua/@40.4490301,-8.6885608,211725m/data=!3m1!1e3!4m18!1m9!3m8!1s0xd24812b45ba91bd:0x5e4f17c8a663f756!2sPatinhas+na+Lua!8m2!3d40.4498579!4d-8.029192!9m1!1b1!16s%2Fg%2F11yf_bnm93!3m7!1s0xd24812b45ba91bd:0x5e4f17c8a663f756!8m2!3d40.4498579!4d-8.029192!9m1!1b1!16s%2Fg%2F11yf_bnm93?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              className="bg-yellow-400 text-yellow-900 font-bold py-2 px-6 rounded-full shadow hover:bg-yellow-300 transition"
            >
              Avaliar no Google
            </a>
          </div>

          {/* CARD 3: MY PETS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Meus Pets 🐾</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {dbUser.pets.length}
                </span>
              </div>

              {dbUser.pets.length === 0 ? (
                <p className="text-gray-500 text-sm">Ainda não registou nenhum animal.</p>
              ) : (
                <ul className="space-y-3">
                  {dbUser.pets.slice(0, 3).map(pet => (
                    <li key={pet.id} className="flex items-center gap-3 text-sm text-gray-700 bg-slate-50 p-2 rounded">

                      {/* --- DYNAMIC ICON LOGIC --- */}
                      <span className="text-lg" title={pet.species}>
                        {SPECIES_ICON_MAP[pet.species] || "🐾"}
                      </span>
                      {/* ------------------------- */}

                      <span className="font-medium">{pet.name}</span>
                      <span className="text-gray-400 text-xs">({pet.breed || "Raça?"})</span>
                    </li>
                  ))}
                  {dbUser.pets.length > 3 && <li className="text-xs text-center text-gray-400">+ outros...</li>}
                </ul>
              )}
            </div>

            <Link href="/dashboard/pets" className="mt-6 block">
              <button className="w-full border-2 border-blue-100 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition">
                Gerir Meus Animais
              </button>
            </Link>
          </div>

          {/* CARD 4: UPCOMING APPOINTMENTS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Visitas 🗓️</h3>

            {dbUser.appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Sem agendamentos futuros.</p>
              </div>
            ) : (
              <div className="space-y-4">


                {dbUser.appointments.map(app => (
                  <div key={app.id} className="flex gap-4 border-l-4 border-green-500 bg-green-50 p-3 rounded-r-lg items-center">
                    <div className="text-center min-w-[50px]">
                      <span className="block text-lg font-bold text-green-700">
                        {app.date.getDate()}
                      </span>
                      <span className="block text-xs font-bold uppercase text-green-600">
                        {app.date.toLocaleString('pt-PT', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{app.service.name}</p>
                      <p className="text-sm text-gray-600">
                        {app.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} • {app.pet.name}
                      </p>
                    </div>
                    <CancelButton id={app.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}