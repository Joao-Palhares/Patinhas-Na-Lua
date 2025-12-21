import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();

  // 1. SMART CHECK: If user is logged in...
  if (user) {
    // ...check if they exist in our Database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    // 2. If they are NOT in the database, force them to Onboarding
    if (!dbUser) {
      redirect("/onboarding");
    }
    
    // 3. If they ARE in the database, you might want to send them straight to Dashboard
    // Uncomment the next line if you want that:
    // redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-blue-600">Patinhas na Lua 🌙</h1>
        
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          
          <SignedIn>
            <div className="flex gap-4 items-center">
               <Link href="/dashboard">
                 <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                   Ir para a Área de Cliente
                 </button>
               </Link>
               <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                Entrar / Criar Conta
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </main>
  );
}