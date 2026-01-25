import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProductForm from "../product-form";

export const metadata = {
  title: "Novo Produto | Admin",
};

export default async function NewProductPage() {
  const brands = await db.dogFoodBrand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (brands.length === 0) {
    redirect("/admin/stock/brands?new=1");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">➕ Novo Produto</h1>
      <ProductForm brands={brands} />
    </div>
  );
}
