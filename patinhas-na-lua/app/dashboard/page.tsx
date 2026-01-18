import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "./cancel-button";
import { ReferralCard } from "./components/referral-card";
import { ReviewPrompt } from "./components/review-prompt";

// 1. DEFINE THE MAPPING HERE
const SPECIES_ICON_MAP: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  RABBIT: "🐰",
  OTHER: "🐾"
};

import { Hand, PawPrint } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // 1. Fetch User Data (Pets & Appointments)
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      pets: true,
      _count: { select: { referrals: true } },
      appointments: {
        where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: { service: true, pet: true }
      }
    }
  });

  if (!dbUser) redirect("/onboarding");

  // 2. CHECK FOR PENDING REVIEWS (New Feature)
  const pendingReview = await db.appointment.findFirst({
    where: {
      userId: user.id,
      status: "COMPLETED",
      review: null
    },
    orderBy: { date: "desc" },
    include: { pet: true, service: true }
  });

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 mt-8">

        {/* PENDING REVIEW PROMPT */}
        {pendingReview && (
          <ReviewPrompt
            appointmentId={pendingReview.id}
            petName={pendingReview.pet.name}
            serviceName={pendingReview.service.name}
          />
        )}

        {/* WELCOME BANNER */}
        <div className="bg-primary-soft rounded-2xl py-5 px-8 text-foreground shadow-sm mb-8 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-primary">Bem-vindo de volta!</h2>
            <Hand className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="opacity-90">Pronto para mimar o seu melhor amigo?</p>
          <div className="mt-8">
            <Link href="/dashboard/book">
              <button className="bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary-hover transition">
                📅 Agendar Nova Visita
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* CARD 1.5: REFERRAL SYSTEM (NEW) */}
          <div className="md:col-span-2">
            <ReferralCard
              existingCode={dbUser.referralCode}
              referralCount={dbUser._count.referrals}
            />
          </div>

          {/* CARD 1: LOYALTY CARD (NEW) */}
          <Link href="/dashboard/rewards">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden h-full group transition hover:shadow-md">
              {/* Decorative Bone - Moved to bottom right */}
              <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 transition rotate-12">
                <span className="text-9xl">🦴</span>
              </div>

              <h3 className="text-lg font-bold text-primary mb-2">Clube Patinhas 🦴</h3>

              <div className="relative z-10 flex flex-col justify-center h-full min-h-[100px]">
                <p className="text-4xl font-black text-primary mb-1">
                  {dbUser.loyaltyPoints} <span className="text-lg font-bold text-foreground/50">Patinhas</span>
                </p>
                <p className="text-sm text-foreground/70 font-medium">Troque as suas patinhas por ofertas!</p>

                <span className="mt-4 text-xs font-bold text-primary uppercase tracking-wider group-hover:underline">
                  Ver Prémios →
                </span>
              </div>
            </div>
          </Link>

          {/* CARD 2: REVIEW BOOSTER (NEW) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-2">⭐</span>
            <h3 className="text-lg font-bold text-primary mb-1">Gostou do serviço?</h3>
            <p className="text-sm text-foreground/70 font-medium mb-4">A sua opinião ajuda-nos a crescer!</p>
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
                <h3 className="text-lg font-bold text-primary">Meus Pets 🐾</h3>
                <span className="bg-primary-light text-primary text-xs font-bold px-2 py-1 rounded-full">
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

            <Link href="/dashboard/pets" className="mt-6 block text-center md:text-left">
              <button className="bg-primary text-white font-bold py-1.5 px-6 rounded-lg hover:bg-primary-hover transition shadow-sm text-sm flex items-center gap-2 mx-auto md:mx-0">
                <PawPrint className="w-4 h-4" />
                Gerir Meus Animais
              </button>
            </Link>
          </div>

          {/* CARD 4: UPCOMING APPOINTMENTS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-primary">Próximas Visitas 🗓️</h3>
               <Link href="/dashboard/history" className="text-sm font-bold text-primary hover:underline">
                  Ver Histórico →
               </Link>
            </div>

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