import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Serviços e Preços",
  description: "Consulte a nossa tabela de preços para Banhos, Tosquias e Serviços de Spa para cães e gatos."
};

export default async function ServicesPage() {
  
  // Fetch Active Services with Prices
  const services = await db.service.findMany({
    where: { isActive: true },
    include: {
      options: {
        orderBy: { price: "asc" } // Show lowest price first ("From X €")
      }
    },
    orderBy: { category: "asc" }
  });

  // Group by Category
  const categories = {
    "GROOMING": "Banhos e Tosquias ✂️",
    "HYGIENE": "Higiene e Patinhas 🧼",
    "SPA": "Spa e Tratamentos 🧖‍♀️",
    "EXOTIC": "Gatos e Exóticos 🐱"
  };

  const groupedServices: Record<string, typeof services> = {};

  services.forEach(service => {
    if (!groupedServices[service.category]) {
      groupedServices[service.category] = [];
    }
    groupedServices[service.category].push(service);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-12 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl font-black mb-4">Os Nossos Serviços</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Cuidamos do seu melhor amigo com todo o carinho e profissionalismo. 
                Confira a nossa tabela de preços.
            </p>
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        
        {Object.entries(groupedServices).map(([categoryKey, categoryServices]) => (
          <section key={categoryKey} className="scroll-mt-20" id={categoryKey.toLowerCase()}>
             <h2 className="text-3xl font-black text-slate-800 mb-8 border-l-8 border-blue-500 pl-4">
                {categories[categoryKey as keyof typeof categories] || categoryKey}
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryServices.map(service => {
                    
                    // Determine Price Display
                    const prices = service.options.map(o => Number(o.price));
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    
                    const priceDisplay = minPrice === maxPrice 
                        ? `${minPrice.toFixed(0)}€` 
                        : `${minPrice.toFixed(0)}€ - ${maxPrice.toFixed(0)}€`;

                    return (
                        <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{service.name}</h3>
                                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                                    {service.description || "Serviço de alta qualidade com produtos premium inclusos."}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                <div>
                                    <span className="block text-xs text-gray-400 uppercase font-bold">Preço</span>
                                    <span className="text-2xl font-black text-blue-600">{priceDisplay}</span>
                                </div>
                                <Link href={`/dashboard/book?serviceId=${service.id}`}>
                                    <button className="bg-slate-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition">
                                        Reservar →
                                    </button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
             </div>
          </section>
        ))}

      </main>

      {/* FOOTER CTA */}
      <div className="bg-blue-600 text-white py-12 text-center px-4">
         <h2 className="text-3xl font-bold mb-4">Pronto para marcar?</h2>
         <p className="mb-8 opacity-90">Junte-se a centenas de donos felizes.</p>
         <Link href="/dashboard/book">
            <button className="bg-white text-blue-600 text-xl font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition transform hover:scale-105 active:scale-95">
                Ver Disponibilidade 📅
            </button>
         </Link>
      </div>

    </div>
  );
}
