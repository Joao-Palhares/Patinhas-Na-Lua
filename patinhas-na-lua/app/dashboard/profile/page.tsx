import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) redirect("/onboarding");

  // --- SERVER ACTION TO UPDATE PROFILE ---
  async function updateProfile(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const nif = formData.get("nif") as string;
    const address = formData.get("address") as string;

    await db.user.update({
      where: { id: user!.id },
      data: { name, phone, nif, address }
    });

    revalidatePath("/dashboard/profile");
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          Definições de Conta ⚙️
        </h1>

        <form action={updateProfile} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
              <input 
                name="name" 
                defaultValue={dbUser.name || ""} 
                required 
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telemóvel</label>
              <input 
                name="phone" 
                defaultValue={dbUser.phone || ""} 
                required 
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email (Fixo)</label>
              <input 
                disabled 
                value={dbUser.email} 
                className="w-full border border-gray-200 bg-gray-100 p-3 rounded-lg text-gray-500 cursor-not-allowed" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">NIF</label>
              <input 
                name="nif" 
                defaultValue={dbUser.nif || ""} 
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Morada</label>
            <textarea 
              name="address" 
              rows={3}
              defaultValue={dbUser.address || ""} 
              className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white" 
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition shadow-md">
              Atualizar Dados
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}