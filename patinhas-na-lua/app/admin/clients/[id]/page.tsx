import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Species } from "@prisma/client";
import DeleteForm from "../../components/delete-form"; // Use the component we made earlier
import UpdateClientModal from "./update-client-modal";

// FIX: Next.js 15 params are Promises
export default async function ClientDetailsPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params;

  // 1. Fetch Client with Pets and Appointments
  const client = await db.user.findUnique({
    where: { id: params.id },
    include: {
      pets: true,
      appointments: {
        orderBy: { date: 'desc' },
        take: 5 // Last 5 appointments
      },
      referredBy: true, // Fetch Referrer
    }
  });

  if (!client) redirect("/admin/clients");
  

  async function createPet(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const species = formData.get("species") as Species;
    const breed = formData.get("breed") as string;
    const gender = formData.get("gender") as string;
    const microchip = formData.get("microchip") as string;
    const birthDateString = formData.get("birthDate") as string;
    const medicalNotes = formData.get("medicalNotes") as string;

    await db.pet.create({
      data: {
        userId: client!.id, // Link to THIS client
        name,
        species,
        breed,
        gender,
        microchip,
        medicalNotes,
        // Convert "2024-01-01" string to Date object
        birthDate: birthDateString ? new Date(birthDateString) : null,
      }
    });

    revalidatePath(`/admin/clients/${client!.id}`);
  }

  // --- ACTION: DELETE PET ---
  async function deletePet(formData: FormData) {
    "use server";
    const petId = formData.get("id") as string;
    await db.pet.delete({ where: { id: petId } });
    revalidatePath(`/admin/clients/${client!.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin/clients" className="text-gray-400 hover:text-gray-800 text-xl font-bold">←</a>
        <h1 className="text-3xl font-bold text-slate-800">Ficha de Cliente</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- LEFT COLUMN: INFO & PETS --- */}
        <div className="lg:col-span-2 space-y-8">

          {/* 1. CLIENT INFO CARD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                👤 Dados Pessoais
              </h2>
              <UpdateClientModal client={{
                  id: client.id,
                  name: client.name,
                  phone: client.phone,
                  email: client.email,
                  nif: client.nif,
                  notes: client.notes,
                  address: client.address,
                  referralCode: client.referralCode
              }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Nome</p>
                <p className="text-lg font-medium text-gray-900">{client.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                <p className="text-lg font-medium text-gray-600">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Telemóvel</p>
                <p className="text-lg font-medium text-gray-600">{client.phone || "--"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">NIF</p>
                <p className="text-lg font-medium text-gray-600">{client.nif || "--"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 uppercase font-bold">Morada</p>
                <p className="text-lg font-medium text-gray-600">{client.address || "--"}</p>
              </div>

              <div className="md:col-span-2 mt-2">
                 <p className="text-xs text-gray-400 uppercase font-bold mb-1">Notas Internas</p>
                 <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 whitespace-pre-wrap">
                    {client.notes || "Sem notas."}
                 </div>
              </div>

               {/* Referrer Info */}
               {client.referredBy && (
                  <div className="md:col-span-2 mt-3 bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-700 uppercase">Referenciado Por:</span>
                      <span className="text-sm font-medium text-purple-900">
                         {client.referredBy.name} ({client.referredBy.referralCode || "Sem código"})
                      </span>
                  </div>
               )}
            </div>
          </div>

          {/* 2. PETS LIST */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🐾 Animais ({client.pets.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.pets.map(pet => (
                <div key={pet.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.breed || "Raça Desconhecida"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${pet.species === 'CAT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {pet.species === 'DOG' ? 'Cão' : pet.species === 'CAT' ? 'Gato' : 'Coelho'}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <p>🎂 {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString('pt-PT') : "Idade N/A"}</p>
                    <p>🚻 {pet.gender || "?"}</p>
                    {pet.microchip && <p>🆔 {pet.microchip}</p>}
                    {pet.medicalNotes && (
                      <div className="mt-2 bg-red-50 p-2 rounded text-xs text-red-700 border border-red-100">
                        ⚠️ {pet.medicalNotes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-end">
                    {/* Safe Delete Pet Button */}
                    <DeleteForm id={pet.id} action={deletePet} className="text-xs text-red-400 hover:text-red-600 font-bold">
                      Remover
                    </DeleteForm>
                  </div>
                </div>
              ))}
              {client.pets.length === 0 && (
                <p className="text-gray-500 italic col-span-2">Este cliente ainda não tem animais registados.</p>
              )}
            </div>
          </div>

          {/* 3. APPOINTMENT HISTORY */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Últimos Agendamentos</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-gray-700">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {client.appointments.map(app => (
                    <tr key={app.id}>
                      <td className="p-3 text-gray-600">{app.date.toLocaleDateString('pt-PT')}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">{Number(app.price).toFixed(2)}€</td>
                    </tr>
                  ))}
                  {client.appointments.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-gray-400">Sem histórico.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN: ADD PET FORM --- */}
        <div>
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 sticky top-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4">➕ Adicionar Novo Pet</h3>
            <form action={createPet} className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Nome</label>
                <input name="name" required className="w-full p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" placeholder="Ex: Bobby" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Espécie</label>
                  <select name="species" className="w-full p-2 rounded border border-blue-200 bg-white text-gray-900">
                    <option value="DOG">Cão</option>
                    <option value="CAT">Gato</option>
                    <option value="RABBIT">Coelho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Sexo</label>
                  <select name="gender" className="w-full p-2 rounded border border-blue-200 bg-white text-gray-900">
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Raça</label>
                <input name="breed" className="w-full p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" placeholder="Ex: Labrador" />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Data Nascimento (Aprox.)</label>
                <input name="birthDate" type="date" className="w-full p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Microchip (Opcional)</label>
                <input name="microchip" className="w-full p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Notas Médicas / Alertas</label>
                <textarea name="medicalNotes" rows={2} className="w-full p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" placeholder="Ex: Alergia a frango..." />
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition mt-2">
                Guardar Pet
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}