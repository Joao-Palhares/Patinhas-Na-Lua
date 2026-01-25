import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ShopClient from "./shop-client";

export const metadata = {
  title: "Loja | Minha Conta",
  description: "Encomende rações e produtos para o seu pet",
};

export default async function DashboardShopPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/onboarding");

  // Fetch active brands
  const brands = await db.dogFoodBrand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Fetch active products with brand
  const rawProducts = await db.dogFood.findMany({
    where: { isActive: true },
    include: { brand: true },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });

  // Convert Decimal to number for client components
  const products = rawProducts.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    comparePrice: p.comparePrice?.toNumber() || null,
    weightKg: p.weightKg?.toNumber() || null,
  }));

  // Fetch user's orders
  const rawOrders = await db.dogFoodOrder.findMany({
    where: { userId: dbUser.id },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const orders = rawOrders.map((o) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    items: o.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      product: {
        ...i.product,
        price: i.product.price.toNumber(),
      },
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🛒 Loja</h1>
        <p className="text-gray-500">Encomende rações premium para o seu pet</p>
      </div>

      <ShopClient
        products={products}
        brands={brands}
        orders={orders}
        userId={dbUser.id}
      />
    </div>
  );
}
