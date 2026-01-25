import { db } from "@/lib/db";
import BrandsClient from "./brands-client";

export const metadata = {
  title: "Marcas | Admin",
};

export default async function BrandsPage() {
  const brands = await db.dogFoodBrand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏷️ Marcas</h1>
      <BrandsClient brands={brands} />
    </div>
  );
}
