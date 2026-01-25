"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, ShoppingBag, X } from "lucide-react";

type Brand = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  weightKg: number | null;
  targetAge: string | null;
  targetSize: string | null;
  nutritionTable: any;
  images: string[];
  isFeatured: boolean;
  brand: Brand;
};

type ProductGridProps = {
  products: Product[];
  brands: Brand[];
  isLoggedIn: boolean;
};

export default function ProductGrid({ products, brands, isLoggedIn }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.brand.name.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !selectedBrand || p.brand.id === selectedBrand;
    const matchesAge = !selectedAge || p.targetAge === selectedAge;
    return matchesSearch && matchesBrand && matchesAge;
  });

  const ageLabels: Record<string, string> = {
    PUPPY: "Cachorro",
    ADULT: "Adulto",
    SENIOR: "Sénior",
    ALL: "Todas as Idades",
  };

  const sizeLabels: Record<string, string> = {
    SMALL: "Pequeno",
    MEDIUM: "Médio",
    LARGE: "Grande",
    GIANT: "Gigante",
    ALL: "Todos",
  };

  return (
    <div>
      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 mb-8 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {/* Brand Filter */}
        <select
          value={selectedBrand || ""}
          onChange={(e) => setSelectedBrand(e.target.value || null)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        >
          <option value="">Todas as Marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Age Filter */}
        <select
          value={selectedAge || ""}
          onChange={(e) => setSelectedAge(e.target.value || null)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        >
          <option value="">Todas as Idades</option>
          <option value="PUPPY">Cachorro</option>
          <option value="ADULT">Adulto</option>
          <option value="SENIOR">Sénior</option>
        </select>
      </div>

      {/* PRODUCT GRID */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-50">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-16 h-16" />
                  </div>
                )}
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    ⭐ Destaque
                  </span>
                )}
                {product.stockQty <= 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Esgotado
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs text-gray-500 font-medium">{product.brand.name}</p>
                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                {product.weightKg && (
                  <p className="text-xs text-gray-400">{product.weightKg}kg</p>
                )}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">{product.price.toFixed(2)}€</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">{product.comparePrice.toFixed(2)}€</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="aspect-square bg-gray-50 rounded-xl relative">
                  {selectedProduct.images[0] ? (
                    <Image
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag className="w-24 h-24" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">{selectedProduct.brand.name}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h3>
                  
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-bold text-primary">{selectedProduct.price.toFixed(2)}€</span>
                    {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                      <span className="text-lg text-gray-400 line-through">{selectedProduct.comparePrice.toFixed(2)}€</span>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {selectedProduct.weightKg && (
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{selectedProduct.weightKg}kg</span>
                    )}
                    {selectedProduct.targetAge && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{ageLabels[selectedProduct.targetAge] || selectedProduct.targetAge}</span>
                    )}
                    {selectedProduct.targetSize && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">{sizeLabels[selectedProduct.targetSize] || selectedProduct.targetSize}</span>
                    )}
                  </div>

                  {selectedProduct.description && (
                    <p className="text-gray-600 text-sm mb-4">{selectedProduct.description}</p>
                  )}

                  <p className={`text-sm font-medium mb-4 ${selectedProduct.stockQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.stockQty > 0 ? `✓ Em stock (${selectedProduct.stockQty} unidades)` : '✗ Esgotado'}
                  </p>

                  {/* CTA */}
                  {isLoggedIn ? (
                    <Link href={`/dashboard/loja?product=${selectedProduct.id}`}>
                      <button 
                        disabled={selectedProduct.stockQty <= 0}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedProduct.stockQty > 0 ? "Encomendar" : "Esgotado"}
                      </button>
                    </Link>
                  ) : (
                    <Link href="/dashboard">
                      <button className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition">
                        Entrar para Encomendar
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Nutrition Table */}
              {selectedProduct.nutritionTable && Object.keys(selectedProduct.nutritionTable).length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-bold text-gray-800 mb-3">Tabela Nutricional</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedProduct.nutritionTable).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 capitalize">{key}</p>
                        <p className="font-bold text-gray-800">{String(value)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {selectedProduct.ingredients && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-bold text-gray-800 mb-2">Ingredientes</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.ingredients}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
