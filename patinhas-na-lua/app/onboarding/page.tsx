import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingForm from "./onboarding-form"; // Import the client form

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/"); 

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (existingUser) redirect("/dashboard");

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao Patinhas na Lua! 🌙
        </h1>
        <p className="text-gray-500 mb-6">
          Por favor preencha todos os dados para continuar.
        </p>

        {/* Use the Client Component here */}
        <OnboardingForm defaultName={fullName} />
        
      </div>
    </div>
  );
}