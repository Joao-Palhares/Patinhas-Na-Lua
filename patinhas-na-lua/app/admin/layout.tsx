import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminMobileNav from "./components/admin-mobile-nav";
import AdminNotifications from "./components/admin-notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.isAdmin) {
    redirect("/dashboard");
  }


  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfTomorrow = new Date(tomorrow); startOfTomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(tomorrow); endOfTomorrow.setHours(23, 59, 59, 999);

  const nextDayAppointments = await db.appointment.findMany({
    where: {
      date: { gte: startOfTomorrow, lte: endOfTomorrow },
      status: { not: "CANCELLED" }
    },
    include: { pet: true, service: true, user: true },
    orderBy: { date: "asc" }
  });

  const appointmentsSafe = nextDayAppointments.map((app: any) => ({
    id: app.id,
    date: app.date,
    pet: { name: app.pet.name },
    service: { name: app.service.name },
    user: { name: app.user.name }
  }));

  return (
    // 1. h-screen locks the app to the window height
    // 2. overflow-hidden prevents double scrollbars
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* SIDEBAR: Stays Fixed */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shadow-xl z-10">
        <div className="p-6 flex items-center gap-3">
          <Image src="/logo.png" alt="Patinhas na Lua" width={40} height={40} className="rounded-lg" />
          <div>
            <h2 className="text-xl font-bold text-blue-400 tracking-wider">
              ADMIN
            </h2>
            <p className="text-xs text-slate-400 mt-1">Patinhas na Lua</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <Link href="/admin/services" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>✂️</span> Serviços e Preços
          </Link>

          <Link href="/admin/expenses" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>💶</span> Despesas (Custos)
          </Link>

          <Link href="/admin/appointments" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>📅</span> Agenda / Marcações
          </Link>

          <Link href="/admin/clients" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>👥</span> Clientes
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>📈</span> Relatórios & Lucro
          </Link>
          <Link href="/admin/fees" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>🏷️</span> Taxas Extras
          </Link>
          <Link href="/admin/invoices" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>🧾</span> Faturas
          </Link>
          <Link href="/admin/coupons" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>🎟️</span> Prémios & Cupões
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>⚙️</span> Configuração
          </Link>
          <Link href="/admin/vacations" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>🏖️</span> Férias
          </Link>

          <div className="my-2 border-t border-slate-800 mx-2"></div>

          <Link href="/admin/marketing" className="flex items-center gap-3 p-3 hover:bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg transition text-white font-bold group">
            <span className="group-hover:animate-spin">✨</span> Estúdio Criativo
          </Link>
          
          <Link href="/admin/reviews" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white">
            <span>⭐</span> Moderação Reviews
          </Link>

          <AdminNotifications appointments={appointmentsSafe} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/admin/scan" className="block p-3 text-center text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            📷 Ler QR Code
          </Link>

          <Link href="/dashboard" className="block p-3 text-center text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition">
            ← Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* MOBILE NAVIGATION (Top Bar + Sidebar) */}
        <AdminMobileNav>
          <div className="border-t border-slate-700 mt-2 pt-2">
            <AdminNotifications appointments={appointmentsSafe} />
          </div>
        </AdminMobileNav>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}