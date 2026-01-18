import { db } from "@/lib/db";
import ServicesMatrix from "@/app/components/landing/services-matrix";

export default async function DashboardPricingPage() {
  // Fetch active services
  const rawServices = await db.service.findMany({
    where: { isActive: true },
    include: { options: true },
    orderBy: { category: 'asc' }
  });

  // Serialize Decimal to Number for Client Component
  // @ts-ignore
  const services = rawServices.map((service) => ({
    ...service,
    // @ts-ignore
    options: service.options.map((opt) => ({
      ...opt,
      price: opt.price.toNumber()
    }))
  }));

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 pb-20">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Preçário</h1>
            <p className="text-gray-500 mt-2">
                Consulte a nossa tabela de preços atualizada. 
                Os valores podem sofrer ajustes consoante o estado do pelo e comportamento do animal.
            </p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 md:p-6">
            <ServicesMatrix services={services} />
        </div>
    </div>
  );
}
