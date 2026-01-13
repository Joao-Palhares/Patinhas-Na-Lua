import { db } from "@/lib/db";
import { ServiceCategory, PetSize, CoatType } from "@prisma/client";
import DeleteForm from "../components/delete-form";
// 1. IMPORT THE ACTIONS (Do not define them again below)
import { createService, addPriceOption, deleteService, deleteOption } from "./actions";
import EditServiceModal from "./edit-service-modal";
import EditOptionModal from "./edit-option-modal";

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
  SHORT: "Pelo Curto",
  MEDIUM: "Pelo Médio",
  LONG: "Pelo Comprido",
};

import SearchServices from "./search-services";

// Sorting Priority
const COAT_PRIORITY: Record<string, number> = {
  "SHORT": 1,
  "MEDIUM": 2,
  "LONG": 3,
};

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params?.q || "";

  // 1. Fetch Raw Data
  const rawServices = await db.service.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      isActive: true, // Only show active services (Soft Delete)
    } as any, // Cast to any to bypass outdated types
    include: { options: true },
    orderBy: { name: "asc" } // Changed from category to name
  });

  // 2. Transform & SORT Data
  const services = rawServices.map(service => ({
    ...service,
    options: (service as any).options
      .map((opt: any) => ({
        ...opt,
        price: Number(opt.price) // Convert Decimal to Number
      }))
      .sort((a: any, b: any) => {
        // Sort by Coat Type first
        const coatA = a.coatType ? COAT_PRIORITY[a.coatType] || 99 : 0;
        const coatB = b.coatType ? COAT_PRIORITY[b.coatType] || 99 : 0;

        if (coatA !== coatB) return coatA - coatB;

        // Then by Price
        return a.price - b.price;
      })
  }));

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Gestão de Serviços</h1>

      {/* --- CREATE SERVICE FORM --- */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">1. Criar Título do Serviço</h2>
        <p className="text-sm text-gray-500 mb-4">Crie o nome primeiro. Depois adicione os preços.</p>

        {/* Use the IMPORTED action here */}
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

          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
            <input
              type="checkbox"
              name="isMobileAvailable"
              id="newMobileCheck"
              defaultChecked
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="newMobileCheck" className="text-sm font-bold text-gray-700 cursor-pointer">
              Disponível ao Domicílio? 🚐
            </label>
          </div>

          <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded border border-yellow-200">
            <input
              type="checkbox"
              name="isTimeBased"
              id="timeCheck"
              className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 border-yellow-300"
            />
            <label htmlFor="timeCheck" className="text-sm font-bold text-yellow-700 cursor-pointer">
              Preço ao Tempo (Hora) ⏳
            </label>
          </div>

          <button className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition w-full md:w-auto self-end">
            Criar Título
          </button>
        </form>
      </div>

      {/* --- LIST SERVICES --- */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Serviços e Preços</h2>
      <SearchServices />
      <div className="space-y-6">
        {services.map((service: any) => (
          <div key={service.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

            {/* Header */}
            <div className="bg-slate-100 p-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-800">
                    {service.name} 
                    {(service as any).isTimeBased && <span className="text-xs bg-yellow-100 text-yellow-700 ml-2 px-2 py-1 rounded border border-yellow-200">⏳ PREÇO / HORA</span>}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold uppercase tracking-wide">
                    {CATEGORY_LABELS[service.category as ServiceCategory]}
                  </span>
                  <EditServiceModal service={service} />
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
              </div>

              {/* Imported delete action */}
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
                    <th className="py-2 px-3 text-gray-600 font-bold">Pelo</th>
                    <th className="py-2 px-3 text-gray-600 font-bold">Tempo (Min - Máx)</th>
                    <th className="py-2 px-3 text-gray-600 font-bold">Preço</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {service.options.map((opt: any) => (
                    <tr key={opt.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-700 font-medium">
                        {opt.petSize ? SIZE_LABELS[opt.petSize as PetSize] : "Todos"}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {opt.coatType ? COAT_LABELS[opt.coatType as CoatType] : "Todos"}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {opt.durationMin} {opt.durationMax ? `- ${opt.durationMax}` : ""} min
                      </td>
                      <td className="py-2 px-3 font-bold text-green-600 text-base">
                        {Number(opt.price).toFixed(2)}€
                        {(service as any).isTimeBased ? "/h" : ""}
                      </td>
                      <td className="py-2 px-3 text-right flex items-center justify-end gap-2">

                        <EditOptionModal option={opt} serviceCategory={service.category} />

                        {/* Imported delete option action */}
                        <DeleteForm
                          id={opt.id}
                          action={deleteOption}
                          className="text-red-400 hover:text-red-600 text-xs font-bold"
                        >
                          X
                        </DeleteForm>
                      </td>
                    </tr>
                  ))}
                  {service.options.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-4 italic">
                        Sem preços. Adicione abaixo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* --- ADD PRICE FORM --- */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase mb-3">2. Adicionar Regra de Preço</p>

                {/* Imported add price action */}
                <form action={addPriceOption} className="flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="serviceId" value={service.id} />

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tamanho</label>
                    <select name="size" className="block border border-gray-300 p-2 rounded text-sm w-36 text-gray-900 bg-white">
                      <option value="ALL">Qualquer Tamanho</option>
                      {Object.entries(SIZE_LABELS).map(([key, label]) => {
                        // Filter sizes for EXOTIC animals (likely Cats/Rabbits -> Toy/Small only)
                        if (service.category === 'EXOTIC' && !['TOY', 'SMALL'].includes(key)) {
                          return null;
                        }
                        return <option key={key} value={key}>{label}</option>
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pelo</label>
                    <select name="coat" className="block border border-gray-300 p-2 rounded text-sm w-36 text-gray-900 bg-white">
                      <option value="ALL">Qualquer pelo</option>
                      {Object.entries(COAT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mín (m)</label>
                    <input name="durationMin" type="number" required placeholder="60" className="block border border-gray-300 p-2 rounded text-sm w-20 text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Máx (m)</label>
                    <input name="durationMax" type="number" placeholder="90" className="block border border-gray-300 p-2 rounded text-sm w-20 text-gray-900 bg-white" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preço (€)</label>
                    <input name="price" type="number" step="0.01" required placeholder="35.00" className="block border border-gray-300 p-2 rounded text-sm w-24 text-gray-900 bg-white" />
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