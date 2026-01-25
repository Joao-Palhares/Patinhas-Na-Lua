"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ShoppingBag, X, Plus, Minus, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { createOrder } from "./actions";
import { toast } from "sonner";

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

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; price: number };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  items: OrderItem[];
};

type CartItem = {
  product: Product;
  quantity: number;
};

type ShopClientProps = {
  products: Product[];
  brands: Brand[];
  orders: Order[];
  userId: string;
};

export default function ShopClient({ products, brands, orders, userId }: ShopClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.brand.name.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !selectedBrand || p.brand.id === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) return;
    
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          toast.error("Stock insuficiente");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > i.product.stockQty) {
              toast.error("Stock insuficiente");
              return i;
            }
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const items = cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.price,
      }));

      const result = await createOrder({ items, notes, totalAmount: cartTotal });

      if (result.success) {
        toast.success(`Encomenda #${result.orderNumber} criada com sucesso!`);
        setCart([]);
        setShowCart(false);
        setNotes("");
        // Reload page to see new order
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao criar encomenda");
      }
    } catch (e) {
      toast.error("Erro ao criar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: Package },
    READY: { label: "Pronto", color: "bg-green-100 text-green-700", icon: CheckCircle },
    COMPLETED: { label: "Entregue", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
  };

  return (
    <div>
      {/* TOP BAR */}
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
        <div className="flex gap-4 items-center flex-1">
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
        </div>

        <div className="flex gap-3">
          {/* Orders Button */}
          <button
            onClick={() => setShowOrders(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Minhas Encomendas</span>
            {orders.length > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <span className="bg-white text-primary text-xs px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
            )}
          </button>
        </div>
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
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition overflow-hidden group"
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
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">{product.price.toFixed(2)}€</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">{product.comparePrice.toFixed(2)}€</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockQty <= 0}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCart(false)}>
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">🛒 Carrinho</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Carrinho vazio</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 py-3 border-b">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg relative flex-shrink-0">
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-contain p-1" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-gray-300 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-primary font-bold">{item.product.price.toFixed(2)}€</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Alguma observação sobre a encomenda?"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total:</span>
                      <span className="text-2xl font-bold text-primary">{cartTotal.toFixed(2)}€</span>
                    </div>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition disabled:opacity-50"
                    >
                      {isSubmitting ? "A processar..." : "Confirmar Encomenda"}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Pagamento na loja ao levantar a encomenda
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS MODAL */}
      {showOrders && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrders(false)}>
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">📦 Minhas Encomendas</h2>
              <button onClick={() => setShowOrders(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Ainda não tem encomendas</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = statusLabels[order.status] || statusLabels.PENDING;
                    const StatusIcon = status.icon;
                    return (
                      <div key={order.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold">{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                              <span className="font-medium">{(item.unitPrice * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t">
                          <span className="font-medium">Total</span>
                          <span className="font-bold text-primary">{order.totalAmount.toFixed(2)}€</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
