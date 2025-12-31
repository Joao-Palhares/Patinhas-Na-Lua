import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import ServicesMatrix from "@/app/components/landing/services-matrix";
import BookingCalendar from "@/app/components/landing/booking-calendar";
import PortfolioFan from "@/app/components/landing/portfolio-fan";
import AuthCta from "@/app/components/auth-cta";

export default async function LandingPage() {
  const user = await currentUser();
  let isAdmin = false;

  if (user) {
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (dbUser?.isAdmin) isAdmin = true;
  }

  const rawServices = await db.service.findMany({
    include: { options: true },
    orderBy: { category: 'asc' }
  });

  const services = rawServices.map(service => ({
    ...service,
    options: service.options.map(opt => ({
      ...opt,
      price: opt.price.toNumber()
    }))
  }));

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <span className="font-serif font-bold text-lg tracking-tight">Patinhas na Lua</span>
          </div>

          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#servicos" className="hover:text-blue-600 transition">Serviços</a>
            <a href="#reviews" className="hover:text-blue-600 transition">Clientes</a>
            <a href="#agendar" className="hover:text-blue-600 transition">Agendar</a>
            {isAdmin && (
              <Link href="/admin/appointments" className="text-purple-600 font-bold hover:text-purple-800">
                Área Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <AuthCta />
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-blue-100">
              Estética Animal & Spa
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-gray-900 leading-[1.1] mb-6">
              Cuidamos do seu melhor amigo <br /> com <span className="italic text-blue-600">amor e consciência.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
              Utilizamos produtos 100% naturais e técnicas que respeitam o tempo do seu pet.
              Banhos, tosquias e mimos sem stress.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#agendar">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl hover:-translate-y-1 transform duration-200">
                  Agendar Visita 📅
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* TRUST BADGES */}
        <section className="py-10 border-y border-gray-100 bg-gray-50/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center grayscale opacity-80 hover:grayscale-0 transition duration-500">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🌿</span>
                <p className="font-bold text-xs uppercase tracking-widest text-gray-600">Produtos Veganos</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🐰</span>
                <p className="font-bold text-xs uppercase tracking-widest text-gray-600">Cruelty Free</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🛡️</span>
                <p className="font-bold text-xs uppercase tracking-widest text-gray-600">Espaço Seguro</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🎓</span>
                <p className="font-bold text-xs uppercase tracking-widest text-gray-600">Certificados</p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="servicos" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold mb-4">Menu de Serviços</h2>
              <p className="text-gray-400">Transparência total nos nossos preços.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden p-2">
              <ServicesMatrix services={services} />
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="py-24 bg-slate-900 text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">

            <div>
              <h2 className="text-3xl font-serif font-bold mb-8">Eles abanam a cauda.<br />Os donos confiam.</h2>
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 relative">
                <div className="text-yellow-400 text-xl mb-4">★★★★★</div>
                <p className="text-lg italic font-serif text-gray-200 mb-6 leading-relaxed">
                  "O melhor sítio para deixar o meu cão! Ele volta sempre feliz e cheiroso. A equipa é 5 estrelas e nota-se que gostam mesmo de animais."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-500 rounded-full overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=5" alt="User" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">João M.</p>
                    <p className="text-xs text-gray-400">Cliente Recorrente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center scale-90 md:scale-100">
              <PortfolioFan />
            </div>
          </div>
        </section>

        {/* BOOKING CALENDAR */}
        <section id="agendar" className="py-24 bg-blue-50/50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Pronto para agendar?</h2>
            <p className="text-gray-500 mb-12 max-w-xl mx-auto">
              Verifique a nossa disponibilidade em tempo real. Se encontrar uma vaga a verde, aproveite! Elas desaparecem rápido.
            </p>

            <div className="bg-white p-2 md:p-8 rounded-3xl shadow-xl border border-gray-100 mb-8">
              {/* PASSING THE PROP HERE */}
              <BookingCalendar isLoggedIn={!!user} />
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-white border-t border-gray-100 py-12 text-center">
        <p className="text-2xl mb-2">🌙</p>
        <p className="text-sm font-bold text-gray-900">Patinhas na Lua</p>
        <p className="text-xs text-gray-400 mt-2">© 2025. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}