import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "../product-form";

export const metadata = {
  title: "Editar Produto | Admin",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const brands = await db.dogFoodBrand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const rawProduct = await db.dogFood.findUnique({ where: { id } });
  if (!rawProduct) notFound();

  const product = {
    ...rawProduct,
    price: rawProduct.price.toNumber(),
    comparePrice: rawProduct.comparePrice?.toNumber() || null,
    weightKg: rawProduct.weightKg?.toNumber() || null,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ Editar Produto</h1>
      <ProductForm brands={brands} product={product} />
    </div>
  );
}
