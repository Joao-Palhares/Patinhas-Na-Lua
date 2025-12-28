import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  
  if (!dbUser?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    // 1. h-screen locks the app to the window height
    // 2. overflow-hidden prevents double scrollbars
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* SIDEBAR: Stays Fixed */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shadow-xl z-10">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-400 tracking-wider">
            ADMIN 🌙
          </h2>
          <p className="text-xs text-slate-400 mt-1">Patinhas na Lua</p>
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
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="block p-3 text-center text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition">
            ← Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT: This part scrolls independently */}
      <main className="flex-1 overflow-y-auto bg-slate-100 p-8">
        {children}
      </main>
      
    </div>
  );
}