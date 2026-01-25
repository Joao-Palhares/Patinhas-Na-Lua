"use client";

import { useState } from "react";
import { Clock, Package, CheckCircle, XCircle, Phone, Mail } from "lucide-react";
import { updateOrderStatus } from "./actions";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: Date;
  user: { name: string | null; email: string; phone: string | null };
  items: OrderItem[];
};

const statusConfig: Record<string, { label: string; color: string; icon: any; next: string | null }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock, next: "CONFIRMED" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: Package, next: "READY" },
  READY: { label: "Pronto", color: "bg-green-100 text-green-700", icon: CheckCircle, next: "COMPLETED" },
  COMPLETED: { label: "Entregue", color: "bg-gray-100 text-gray-700", icon: CheckCircle, next: null },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle, next: null },
};

const nextStatusLabel: Record<string, string> = {
  PENDING: "Confirmar",
  CONFIRMED: "Marcar Pronto",
  READY: "Marcar Entregue",
};

export default function OrdersSection({ orders }: { orders: Order[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoading(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success("Estado atualizado");
        window.location.reload();
      } else {
        toast.error(result.error || "Erro");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Cancelar esta encomenda?")) return;
    await handleStatusChange(orderId, "CANCELLED");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => {
        const status = statusConfig[order.status] || statusConfig.PENDING;
        const StatusIcon = status.icon;

        return (
          <div key={order.id} className="bg-white rounded-xl border p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-800">{order.orderNumber}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>

            {/* Customer */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="font-medium text-sm">{order.user.name || "Cliente"}</p>
              <div className="flex gap-3 mt-1">
                {order.user.phone && (
                  <a href={`tel:${order.user.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                    <Phone className="w-3 h-3" />
                    {order.user.phone}
                  </a>
                )}
                <a href={`mailto:${order.user.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                  <Mail className="w-3 h-3" />
                  Email
                </a>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1 mb-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                  <span className="font-medium">{(item.unitPrice * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-yellow-50 rounded-lg p-2 mb-3">
                <p className="text-xs text-yellow-700">📝 {order.notes}</p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t mb-3">
              <span className="font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-primary">{order.totalAmount.toFixed(2)}€</span>
            </div>

            {/* Actions */}
            {status.next && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(order.id, status.next!)}
                  disabled={loading === order.id}
                  className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50"
                >
                  {loading === order.id ? "..." : nextStatusLabel[order.status]}
                </button>
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={loading === order.id}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
