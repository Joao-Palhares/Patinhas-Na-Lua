import { UserButton } from "@clerk/nextjs";
import UserButtonWrapper from "../components/user-button-wrapper";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  console.log("--- DEBUG LOGIN ---");
  console.log("Clerk User ID:", user.id);

  // Optional: Check if user exists in DB to prevent errors
  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  console.log("DB User Found:", !!dbUser);
  console.log("-------------------");

  if (!dbUser) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- PERSISTENT NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition">🌙</span>
            <span className="font-bold text-blue-600 text-lg hidden md:block">Patinhas na Lua</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 transition">
              Início
            </Link>
            <Link href="/dashboard/pets" className="hover:text-blue-600 transition">
              Meus Pets
            </Link>
            <Link href="/dashboard/book" className="hover:text-blue-600 transition">
              Agendar
            </Link>
            {/* If Admin, show Admin Link */}
            {dbUser.isAdmin && (
              <Link href="/admin/appointments" className="text-purple-600 font-bold hover:text-purple-800">
                Área Admin
              </Link>
            )}
          </div>

          {/* User Profile (Clerk Handles this) */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/book" className="md:hidden">
              <button className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
                + Agendar
              </button>
            </Link>
            <UserButtonWrapper dbUser={dbUser} />
          </div>

        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      {children}
    </div>
  );
}