import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import ServicesMatrix from "@/app/components/landing/services-matrix";
import BookingCalendar from "@/app/components/landing/booking-calendar";
import PortfolioFan from "@/app/components/landing/portfolio-fan";
import AuthCta from "@/app/components/auth-cta";
import { ReviewsCarousel } from "@/app/components/landing/reviews-carousel";

export default async function LandingPage() {
  const user = await currentUser();
  let isAdmin = false;

  if (user) {
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (dbUser?.isAdmin) isAdmin = true;
  }

  const rawServices = await db.service.findMany({
    // Filter active services for the public landing page!
    where: { isActive: true } as any, // Cast to 'any' until Prisma re-generates
    include: { options: true },
    orderBy: { category: 'asc' }
  });

  const services = rawServices.map((service: any) => ({
    ...service,
    options: service.options.map((opt: any) => ({
      ...opt,
      price: opt.price.toNumber()
    }))
  }));

  // FETCH SCHEDULE
  const workingDays = await db.$queryRaw<any[]>`SELECT "dayOfWeek", "isClosed" FROM "WorkingDay"`;
  const closedDays = workingDays.filter((d: any) => d.isClosed).map((d: any) => d.dayOfWeek);
  const finalClosedDays = workingDays.length > 0 ? closedDays : [0, 6];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureAbsences = await db.$queryRaw<any[]>`SELECT "startDate", "endDate" FROM "Absence" WHERE "endDate" >= ${today}`;
  const absenceRanges = futureAbsences.map((a: any) => ({
    from: new Date(a.startDate),
    to: new Date(a.endDate)
  }));

  // FETCH SETTINGS for Address
  const settings = await db.businessSettings.findUnique({ where: { id: "default" } });

  // FETCH PORTFOLIO IMAGES
  const portfolioImages = await db.portfolioImage.findMany({
    where: { isPublic: true },
    orderBy: { order: 'asc' },
    take: 12
  });

  return (
    <div className="min-h-screen bg-white font-sans text-foreground selection:bg-primary/20">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Patinhas na Lua Logo" width={40} height={40} className="rounded-lg" priority />
            <span className="font-serif font-bold text-lg tracking-tight text-primary">Patinhas na Lua</span>
          </div>

          <div className="hidden md:flex gap-8 text-sm font-medium text-foreground">
            <a href="#servicos" className="hover:text-primary transition">Serviços</a>
            <Link href="/loja" className="hover:text-primary transition">Loja</Link>
            <a href="#reviews" className="hover:text-primary transition">Clientes</a>
            <a href="#agendar" className="hover:text-primary transition">Agendar</a>
            {isAdmin && (
              <Link href="/admin/appointments" className="text-primary font-bold hover:text-primary-hover border border-primary/20 px-3 py-1 rounded-full text-xs">
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
            <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-primary/20">
              Estética Animal & Spa
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-primary leading-[1.1] mb-6">
              Cuidamos do seu melhor amigo <br /> com <span className="italic text-primary">amor e consciência.</span>
            </h1>
            <p className="text-lg text-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Utilizamos produtos 100% naturais e técnicas que respeitam o tempo do seu pet.
              Banhos, tosquias e mimos sem stress.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#agendar">
                <button className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-hover transition shadow-xl hover:-translate-y-1 transform duration-200">
                  Agendar Visita 📅
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* TRUST BADGES */}
        <section className="py-10 border-y border-secondary/20 bg-primary-light">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
                <p className="font-bold text-xs uppercase tracking-widest text-secondary">Certificados</p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="servicos" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold mb-4 text-primary">Menu de Serviços</h2>
              <p className="text-gray-600">Transparência total nos nossos preços.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden p-2">
              <ServicesMatrix services={services} />
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="py-24 bg-[#efb1b1] text-foreground overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">

            <div>
              <h2 className="text-3xl font-serif font-bold mb-8">Eles abanam a cauda.<br />Os donos confiam.</h2>
              <ReviewsCarousel />
            </div>

            <div className="flex justify-center scale-90 md:scale-100">
              <PortfolioFan images={portfolioImages} />
            </div>
          </div>
        </section>

        {/* BOOKING CALENDAR */}
        <section id="agendar" className="py-24 bg-primary-soft/50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-serif font-bold text-primary mb-4">Pronto para agendar?</h2>
            <p className="text-foreground mb-12 max-w-xl mx-auto">
              Verifique a nossa disponibilidade em tempo real. Se encontrar uma vaga a verde, aproveite! Elas desaparecem rápido.
            </p>

            <div className="bg-white p-2 md:p-8 rounded-3xl shadow-xl border border-gray-100 mb-8">
              {/* PASSING THE PROP HERE */}
              <BookingCalendar
                isLoggedIn={!!user}
                closedDays={finalClosedDays}
                absenceRanges={absenceRanges}
              />
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-white border-t border-gray-100 py-12 text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Patinhas na Lua Logo" width={80} height={80} className="rounded-xl" />
        </div>
        <p className="text-sm font-bold text-primary">Patinhas na Lua</p>
        
        {/* ADD ADDRESS HERE */}
        {settings?.baseAddress && (
          <p className="text-sm text-gray-500 mt-2">{settings.baseAddress}</p>
        )}

        <div className="flex gap-4 justify-center text-xs text-gray-500 mt-4">
          <p>© 2025. Todos os direitos reservados.</p>
          <Link href="/terms" className="hover:underline">Termos e Condições</Link>
        </div>
      </footer>
    </div>
  );
}