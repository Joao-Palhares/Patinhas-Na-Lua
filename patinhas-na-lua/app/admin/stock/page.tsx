import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import StockTable from "./stock-table";
import OrdersSection from "./orders-section";

export const metadata = {
  title: "Stock | Admin",
  description: "Gestão de produtos e encomendas",
};

export default async function AdminStockPage() {
  // Fetch brands
  const brands = await db.dogFoodBrand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  // Fetch products with brand
  const rawProducts = await db.dogFood.findMany({
    include: { brand: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const products = rawProducts.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    comparePrice: p.comparePrice?.toNumber() || null,
    weightKg: p.weightKg?.toNumber() || null,
  }));

  // Fetch pending orders
  const rawOrders = await db.dogFoodOrder.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED", "READY"] } },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = rawOrders.map((o) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    items: o.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
    })),
  }));

  // Stats
  const lowStockCount = products.filter((p) => p.stockQty <= 3 && p.isActive).length;
  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛒 Stock & Loja</h1>
          <p className="text-gray-500">Gerir produtos, marcas e encomendas</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/stock/brands">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <Package className="w-4 h-4" />
              Marcas
            </button>
          </Link>
          <Link href="/admin/stock/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition">
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-gray-500">Produtos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{brands.length}</p>
              <p className="text-xs text-gray-500">Marcas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockCount}</p>
              <p className="text-xs text-gray-500">Stock Baixo</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${pendingOrdersCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Package className={`w-5 h-5 ${pendingOrdersCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingOrdersCount}</p>
              <p className="text-xs text-gray-500">Encomendas Pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS SECTION */}
      {orders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📦 Encomendas Ativas</h2>
          <OrdersSection orders={orders} />
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Produtos</h2>
        <StockTable products={products} brands={brands} />
      </div>
    </div>
  );
}
