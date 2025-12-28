import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

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
          
          {/* CARD 1: MY PETS */}
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

          {/* CARD 2: UPCOMING APPOINTMENTS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Visitas 🗓️</h3>
            
            {dbUser.appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Sem agendamentos futuros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dbUser.appointments.map(app => (
                  <div key={app.id} className="flex gap-4 border-l-4 border-green-500 bg-green-50 p-3 rounded-r-lg">
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