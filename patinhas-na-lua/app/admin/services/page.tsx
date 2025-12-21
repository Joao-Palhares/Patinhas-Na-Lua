import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ServiceCategory, PetSize, CoatType } from "@prisma/client";
import DeleteForm from "../components/delete-form";

// --- CONFIGURATION ---
const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  GROOMING: "Banhos e Tosquias",
  HYGIENE: "Higiene (Unhas/Ouvidos)",
  EXOTIC: "Exóticos (Gatos/Coelhos)",
  SPA: "Spa e Tratamentos",
};

const SIZE_LABELS: Record<PetSize, string> = {
  TOY: "Toy (< 5kg)",
  SMALL: "Pequeno (5 - 10kg)",
  MEDIUM: "Médio (11 - 20kg)",
  LARGE: "Grande (21 - 30kg)",
  XL: "XL (31 - 40kg)",
  GIANT: "Gigante (> 40kg)",
};

const COAT_LABELS: Record<CoatType, string> = {
  SHORT: "Pêlo Curto",
  MEDIUM: "Pêlo Médio",
  LONG: "Pêlo Comprido",
};

export default async function ServicesPage() {
  
  const services = await db.service.findMany({
    include: { options: true },
    orderBy: { category: "asc" }
  });

  // --- ACTIONS ---
  async function createService(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as ServiceCategory;
    
    // CORRECTED: No price/duration here anymore.
    await db.service.create({
      data: { 
        name, 
        description, 
        category 
      }
    });
    revalidatePath("/admin/services");
  }

  async function addPriceOption(formData: FormData) {
    "use server";
    const serviceId = formData.get("serviceId") as string;
    const size = formData.get("size") as PetSize | "ALL";
    const coat = formData.get("coat") as CoatType | "ALL";
    const price = Number(formData.get("price"));
    
    const durationMin = Number(formData.get("durationMin"));
    const durationMax = Number(formData.get("durationMax"));

    await db.serviceOption.create({
      data: {
        serviceId,
        petSize: size === "ALL" ? null : size,
        coatType: coat === "ALL" ? null : coat,
        price,
        durationMin,
        durationMax: durationMax || null,
      }
    });
    revalidatePath("/admin/services");
  }

  async function deleteService(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.service.delete({ where: { id } });
    revalidatePath("/admin/services");
  }

  async function deleteOption(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.serviceOption.delete({ where: { id } });
    revalidatePath("/admin/services");
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Gestão de Serviços</h1>

      {/* --- FORM 1: CREATE NEW SERVICE --- */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">1. Criar Título do Serviço</h2>
        <p className="text-sm text-gray-500 mb-4">Crie o nome primeiro (ex: "Tosquia"). Depois adicione os preços para cada tamanho.</p>
        <form action={createService} className="flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Serviço</label>
              <input 
                name="name" 
                required 
                placeholder="ex: Tosquia Completa" 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="w-full md:w-64">
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
              <select 
                name="category" 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(ServiceCategory).map((c) => (
                  <option key={c} value={c} className="text-gray-900">
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
            <textarea 
              name="description" 
              rows={2}
              placeholder="ex: Inclui banho, corte de unhas..." 
              className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <button className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition w-full md:w-auto self-end">
            Criar Título
          </button>
        </form>
      </div>

      {/* --- LIST OF SERVICES --- */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Serviços e Preços</h2>
      <div className="space-y-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-slate-100 p-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  {service.name} 
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold uppercase tracking-wide">
                    {CATEGORY_LABELS[service.category]}
                  </span>
                </h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
              </div>
              
              {/* --- 2. SAFE DELETE SERVICE BUTTON --- */}
              <DeleteForm 
                id={service.id} 
                action={deleteService} 
                className="text-red-500 text-xs hover:underline font-semibold"
              >
                Apagar Serviço
              </DeleteForm>
            </div>
            
            <div className="p-5">
              <table className="w-full text-sm mb-6 text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-2 px-3 text-gray-600 font-bold">Tamanho</th>
                    <th className="py-2 px-3 text-gray-600 font-bold">Pêlo</th>
                    <th className="py-2 px-3 text-gray-600 font-bold">Tempo (Min - Máx)</th>
                    <th className="py-2 px-3 text-gray-600 font-bold">Preço</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {service.options.map((opt) => (
                    <tr key={opt.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-700 font-medium">
                        {opt.petSize ? SIZE_LABELS[opt.petSize] : "Todos"}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {opt.coatType ? COAT_LABELS[opt.coatType] : "Todos"}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {opt.durationMin} {opt.durationMax ? `- ${opt.durationMax}` : ""} min
                      </td>
                      <td className="py-2 px-3 font-bold text-green-600 text-base">{Number(opt.price).toFixed(2)}€</td>
                      <td className="py-2 px-3 text-right">
                        {/* --- 2. SAFE DELETE SERVICE BUTTON --- */}
                        <DeleteForm 
                          id={service.id} 
                          action={deleteService} 
                          className="text-red-500 text-xs hover:underline font-semibold"
                        >
                          Apagar Serviço
                        </DeleteForm>
                      </td>
                    </tr>
                  ))}
                  {service.options.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-4 italic">
                        Sem preços. Adicione abaixo (Ex: Toy = 30€).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* --- ADD PRICE FORM --- */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase mb-3">2. Adicionar Regra de Preço</p>
                <form action={addPriceOption} className="flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="serviceId" value={service.id} />
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tamanho</label>
                    <select name="size" className="block border border-gray-300 p-2 rounded text-sm w-36 text-gray-900 bg-white">
                      <option value="ALL">Qualquer Tamanho</option>
                      {Object.values(PetSize).map(s => (
                        <option key={s} value={s}>{SIZE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pêlo</label>
                    <select name="coat" className="block border border-gray-300 p-2 rounded text-sm w-36 text-gray-900 bg-white">
                      <option value="ALL">Qualquer Pêlo</option>
                      {Object.values(CoatType).map(c => (
                        <option key={c} value={c}>{COAT_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mín (m)</label>
                    <input 
                      name="durationMin" 
                      type="number" 
                      required 
                      placeholder="60" 
                      className="block border border-gray-300 p-2 rounded text-sm w-20 text-gray-900 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Máx (m)</label>
                    <input 
                      name="durationMax" 
                      type="number" 
                      placeholder="90" 
                      className="block border border-gray-300 p-2 rounded text-sm w-20 text-gray-900 bg-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preço (€)</label>
                    <input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="35.00" 
                      className="block border border-gray-300 p-2 rounded text-sm w-24 text-gray-900 bg-white" 
                    />
                  </div>

                  <button className="bg-green-600 text-white font-bold text-sm px-4 py-2 rounded h-auto hover:bg-green-700 shadow-sm">
                    Adicionar
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}