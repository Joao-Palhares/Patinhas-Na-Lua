"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export async function createOrder(data: {
  items: OrderItem[];
  notes?: string;
  totalAmount: number;
}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { success: false, error: "Utilizador não encontrado" };

    // Validate stock
    for (const item of data.items) {
      const product = await db.dogFood.findUnique({ where: { id: item.productId } });
      if (!product) return { success: false, error: `Produto não encontrado` };
      if (product.stockQty < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product.name}` };
      }
    }

    // Generate order number
    const year = new Date().getFullYear();
    const count = await db.dogFoodOrder.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });
    const orderNumber = `PNL-${year}-${String(count + 1).padStart(4, "0")}`;

    // Create order with items
    const order = await db.dogFoodOrder.create({
      data: {
        orderNumber,
        userId: dbUser.id,
        totalAmount: data.totalAmount,
        notes: data.notes || null,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    // Decrease stock
    for (const item of data.items) {
      await db.dogFood.update({
        where: { id: item.productId },
        data: {
          stockQty: { decrement: item.quantity },
        },
      });
    }

    revalidatePath("/dashboard/loja");
    revalidatePath("/admin/stock");

    return { success: true, orderNumber: order.orderNumber };
  } catch (error) {
    console.error("Create order error:", error);
    return { success: false, error: "Erro ao criar encomenda" };
  }
}
