import { db } from "@/lib/db";
import Link from "next/link";
import { User, Pet } from "@prisma/client";
import AddPetModal from "./add-pet-modal"; // <--- Imported correctly

// FIX: Define as Promise (Next.js 15 standard)
export default async function ClientsPage(props: { 
  searchParams: Promise<{ q?: string }> 
}) {
  // FIX: Await it
  const searchParams = await props.searchParams;
  const query = searchParams?.q || "";

  // 1. Fetch Users (and their Pets) matching the search
  const users = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { pets: { some: { name: { contains: query, mode: "insensitive" } } } }
      ]
    },
    include: { pets: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Clientes & Pets</h1>
      </div>

      {/* SEARCH BAR */}
      <form className="mb-8">
        <div className="relative">
          <input 
            name="q"
            defaultValue={query}
            placeholder="Pesquisar por Nome do Dono, Telemóvel ou Nome do Pet..."
            className="w-full p-4 pl-12 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-lg"
          />
          <span className="absolute left-4 top-4 text-2xl text-gray-400">🔍</span>
          <button type="submit" className="hidden">Search</button>
        </div>
      </form>

      {/* CLIENT LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-bold text-gray-600">Dono</th>
              <th className="p-4 font-bold text-gray-600">Contacto</th>
              <th className="p-4 font-bold text-gray-600">Pets (Animais)</th>
              <th className="p-4 font-bold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition">
                
                {/* 1. Name & Email */}
                <td className="p-4">
                  <div className="font-bold text-gray-900">{client.name || "Sem Nome"}</div>
                  <div className="text-xs text-gray-400">{client.email}</div>
                </td>
                
                {/* 2. Phone */}
                <td className="p-4 text-gray-700">
                  {client.phone || "--"}
                </td>
                
                {/* 3. PETS COLUMN (With the new + Button) */}
                <td className="p-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    
                    {/* THE ADD BUTTON COMPONENT */}
                    <AddPetModal userId={client.id} clientName={client.name || "Cliente"} />

                    {/* The List of Existing Pets */}
                    {client.pets.map(pet => (
                      <span key={pet.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold border border-blue-200">
                        🐾 {pet.name}
                      </span>
                    ))}
                    
                    {client.pets.length === 0 && (
                      <span className="text-gray-400 text-sm italic ml-2">Sem pets</span>
                    )}
                  </div>
                </td>
                
                {/* 4. Details Button */}
                <td className="p-4 text-right">
                  <Link 
                    href={`/admin/clients/${client.id}`}
                    className="bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-black text-sm font-medium transition"
                  >
                    Ver Detalhes
                  </Link>
                </td>
              </tr>
            ))}
            
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                  Nenhum cliente ou animal encontrado com "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}