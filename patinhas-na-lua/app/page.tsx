import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import ServicesMatrix from "@/app/components/landing/services-matrix";
import BookingCalendar from "@/app/components/landing/booking-calendar";
import PortfolioFan from "@/app/components/landing/portfolio-fan";
import { ServiceCategory } from "@prisma/client";

export default async function LandingPage() {
  const user = await currentUser();

  // 1. Fetch Raw Data
  const rawServices = await db.service.findMany({
    include: { options: true },
    orderBy: { category: 'asc' }
  });

  // 2. CRITICAL FIX: Convert Prisma 'Decimal' to plain 'Number'
  // Next.js cannot pass Decimal objects to Client Components
  const services = rawServices.map(service => ({
    ...service,
    options: service.options.map(opt => ({
      ...opt,
      price: opt.price.toNumber() // <--- This fixes the "Decimal objects not supported" error
    }))
  }));

  return (
    <div className="min-h-screen bg-[#C4A494] font-sans selection:bg-pink-200">
      
      {/* --- HEADER --- */}
      <header className="p-6 text-center">
        <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden mb-4">
           <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" className="w-20 h-20 opacity-80" alt="Logo" />
        </div>
        
        <h1 className="font-serif text-5xl text-white drop-shadow-md mb-2">Patinhas na Lua</h1>
        <p className="text-white/90 tracking-widest uppercase text-sm font-bold">Estética Animal & Spa</p>
      </header>

      {/* --- MAIN CONTAINER --- */}
      <main className="max-w-6xl mx-auto p-4 space-y-12 pb-20">

        {/* 1. SERVICES MATRIX SECTION */}
        <section className="bg-[#EBE5CE] p-8 rounded-3xl border-4 border-white shadow-xl">
          <div className="text-center mb-6">
             <h2 className="text-3xl font-serif text-[#5A4633]">Nossos Serviços</h2>
             <p className="text-[#8B735B]">Selecione um serviço para ver a tabela.</p>
          </div>
          
          {/* Now passing the converted 'services' array */}
          <ServicesMatrix services={services} />
        </section>

        {/* 2. CALENDAR SECTION */}
        <section className="bg-white p-8 rounded-3xl border-4 border-[#5A4633] shadow-xl">
          <div className="text-center mb-6">
             <h2 className="text-3xl font-serif text-black uppercase tracking-tighter">Disponibilidade</h2>
          </div>
          <BookingCalendar />
          <div className="text-center mt-6">
            <Link href={user ? "/dashboard/book" : "/sign-up"}>
              <button className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-800 transition">
                {user ? "Confirmar Marcação" : "Login para Marcar"}
              </button>
            </Link>
          </div>
        </section>

        {/* 3. PORTFOLIO & REVIEWS SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="flex justify-center md:justify-start">
             <PortfolioFan />
          </div>

          <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="absolute -top-3 -right-3 bg-yellow-300 border-2 border-black px-2 font-bold text-xs">
              GOOGLE REVIEWS
            </div>
            
            <div className="flex gap-1 text-yellow-500 text-xl mb-2">★★★★★</div>
            <p className="text-lg font-serif italic text-gray-800 mb-4">
              "O melhor sítio para deixar o meu cão! Ele volta sempre feliz e cheiroso. A equipa é 5 estrelas."
            </p>
            <div className="flex items-center gap-3 border-t-2 border-black pt-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full border border-black overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=5" />
              </div>
              <div>
                <p className="font-bold text-sm">João M.</p>
                <p className="text-xs text-gray-500">Cliente desde 2023</p>
              </div>
            </div>
          </div>

        </section>

      </main>

      <footer className="bg-[#5A4633] text-[#EBE5CE] text-center py-8">
        <p>© 2025 Patinhas na Lua</p>
      </footer>
    </div>
  );
}