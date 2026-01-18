import { UserButton } from "@clerk/nextjs";
import UserButtonWrapper from "../components/user-button-wrapper";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-background">
      {/* --- PERSISTENT NAVBAR --- */}
      <nav className="bg-white border-b border-secondary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="Patinhas na Lua" width={32} height={32} className="rounded-lg group-hover:scale-110 transition" />
            <span className="font-bold text-primary text-lg hidden md:block">Patinhas na Lua</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
            <Link href="/dashboard" className="hover:text-primary transition">
              Início
            </Link>
            <Link href="/dashboard/pets" className="hover:text-primary transition">
              Meus Pets
            </Link>
            <Link href="/dashboard/book" className="hover:text-primary transition">
              Agendar
            </Link>
            <Link href="/dashboard/pricing" className="hover:text-primary transition">
              Preçário
            </Link>
            {/* If Admin, show Admin Link */}
            {dbUser.isAdmin && (
              <Link href="/admin/appointments" className="text-primary font-bold hover:text-primary-hover border border-primary/20 px-3 py-1 rounded-full text-xs">
                Área Admin
              </Link>
            )}
          </div>

          {/* User Profile (Clerk Handles this) */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/book" className="md:hidden">
              <button className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg">
                + Agendar
              </button>
            </Link>
            <UserButtonWrapper dbUser={dbUser} />
          </div>

        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      {children}

      <footer className="py-8 text-center text-xs text-foreground/60 mt-auto">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:underline">Termos e Condições</Link>
          <Link href="/privacy" className="hover:underline">Política de Privacidade</Link>
        </div>
        <p>© 2025 Patinhas na Lua</p>
      </footer>
    </div>
  );
}