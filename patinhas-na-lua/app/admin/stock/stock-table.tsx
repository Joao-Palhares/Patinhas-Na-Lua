"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Edit, Trash2, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { deleteProduct, toggleProductActive } from "./actions";
import { toast } from "sonner";

type Brand = {
  id: string;
  name: string;
  _count: { products: number };
};

type Product = {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  weightKg: number | null;
  targetAge: string | null;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  brand: { id: string; name: string };
};

export default function StockTable({ products, brands }: { products: Product[]; brands: Brand[] }) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !selectedBrand || p.brand.id === selectedBrand;
    const matchesActive = showInactive || p.isActive;
    return matchesSearch && matchesBrand && matchesActive;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar "${name}"? Esta ação não pode ser desfeita.`)) return;
    
    const result = await deleteProduct(id);
    if (result.success) {
      toast.success("Produto eliminado");
      window.location.reload();
    } else {
      toast.error(result.error || "Erro ao eliminar");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const result = await toggleProductActive(id, !currentActive);
    if (result.success) {
      toast.success(currentActive ? "Produto desativado" : "Produto ativado");
      window.location.reload();
    } else {
      toast.error(result.error || "Erro");
    }
  };

  return (
    <div>
      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <select
          value={selectedBrand || ""}
          onChange={(e) => setSelectedBrand(e.target.value || null)}
          className="px-4 py-2 border rounded-lg outline-none"
        >
          <option value="">Todas as Marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b._count.products})</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-600">Mostrar inativos</span>
        </label>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className={`${!product.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg relative flex-shrink-0">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-contain p-1 rounded-lg" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        {product.weightKg && <p className="text-xs text-gray-500">{product.weightKg}kg</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.brand.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-primary">{product.price.toFixed(2)}€</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="ml-2 text-xs text-gray-400 line-through">{product.comparePrice.toFixed(2)}€</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${product.stockQty <= 3 ? 'text-orange-600' : product.stockQty <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stockQty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Inativo</span>
                      )}
                      {product.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⭐</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        title={product.isActive ? "Desativar" : "Ativar"}
                      >
                        {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Link href={`/admin/stock/${product.id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
