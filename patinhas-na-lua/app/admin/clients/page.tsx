import { db } from "@/lib/db";
import Link from "next/link";
import { User, Pet } from "@prisma/client";
import AddPetModal from "./add-pet-modal";
import RegisterClientModal from "./register-client-modal";
import Search from "@/app/components/search";
import PaginationControls from "@/app/components/pagination-controls";
import { Prisma } from "@prisma/client";

export default async function ClientsPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || "";
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: Prisma.UserWhereInput = {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { pets: { some: { name: { contains: query, mode: "insensitive" } } } }
    ]
  };

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      include: { pets: true },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip: skip
    }),
    db.user.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Clientes & Pets</h1>
        <RegisterClientModal />
      </div>

      {/* SEARCH BAR (Debounced) */}
      <div className="mb-8">
        <Search placeholder="Pesquisar por Nome do Dono, Telemóvel ou Nome do Pet..." />
      </div>

      {/* CLIENT LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-bold text-gray-600">Dono</th>
              <th className="p-4 font-bold text-gray-600">Código</th>
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
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    {client.name || "Sem Nome"}
                    {!client.nif && (
                      <span title="Falta NIF" className="text-amber-500 cursor-help">
                        {/* AlertTriangle Icon directly SVG or Lucide */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{client.email}</div>
                </td>

                {/* 2. Referral Code */}
                <td className="p-4">
                    {client.referralCode ? (
                        <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 select-all">
                            {client.referralCode}
                        </span>
                    ) : (
                        <span className="text-gray-300 text-xs">--</span>
                    )}
                </td>

                {/* 3. Phone */}
                <td className="p-4 text-gray-700">
                  {client.phone || "--"}
                </td>

                {/* 4. PETS COLUMN (With the new + Button) */}
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

                {/* 5. Details Button */}
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
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                  Nenhum cliente ou animal encontrado com "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls totalPages={totalPages} currentPage={currentPage} />
    </div>
  );
}
