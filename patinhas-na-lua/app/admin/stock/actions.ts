"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

// ========== PRODUCT ACTIONS ==========

export async function createProduct(data: {
  name: string;
  description?: string;
  ingredients?: string;
  price: number;
  comparePrice?: number;
  stockQty: number;
  sku?: string;
  weightKg?: number;
  targetAge?: string;
  targetSize?: string;
  nutritionTable?: Record<string, number>;
  images: string[];
  brandId: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    await db.dogFood.create({
      data: {
        name: data.name,
        description: data.description || null,
        ingredients: data.ingredients || null,
        price: data.price,
        comparePrice: data.comparePrice || null,
        stockQty: data.stockQty,
        sku: data.sku || null,
        weightKg: data.weightKg || null,
        targetAge: data.targetAge as any || null,
        targetSize: data.targetSize as any || null,
        nutritionTable: data.nutritionTable || null,
        images: data.images,
        brandId: data.brandId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
    });

    revalidatePath("/admin/stock");
    revalidatePath("/loja");
    return { success: true };
  } catch (error: any) {
    console.error("Create product error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "SKU já existe" };
    }
    return { success: false, error: "Erro ao criar produto" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description?: string;
    ingredients?: string;
    price: number;
    comparePrice?: number;
    stockQty: number;
    sku?: string;
    weightKg?: number;
    targetAge?: string;
    targetSize?: string;
    nutritionTable?: Record<string, number>;
    images: string[];
    brandId: string;
    isActive: boolean;
    isFeatured: boolean;
  }
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    await db.dogFood.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        ingredients: data.ingredients || null,
        price: data.price,
        comparePrice: data.comparePrice || null,
        stockQty: data.stockQty,
        sku: data.sku || null,
        weightKg: data.weightKg || null,
        targetAge: data.targetAge as any || null,
        targetSize: data.targetSize as any || null,
        nutritionTable: data.nutritionTable || null,
        images: data.images,
        brandId: data.brandId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/stock/" + id);
    revalidatePath("/loja");
    return { success: true };
  } catch (error: any) {
    console.error("Update product error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "SKU já existe" };
    }
    return { success: false, error: "Erro ao atualizar produto" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    // Check if has orders
    const orderItems = await db.dogFoodOrderItem.count({ where: { productId: id } });
    if (orderItems > 0) {
      return { success: false, error: "Produto tem encomendas associadas. Desative-o em vez de eliminar." };
    }

    await db.dogFood.delete({ where: { id } });

    revalidatePath("/admin/stock");
    revalidatePath("/loja");
    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, error: "Erro ao eliminar produto" };
  }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    await db.dogFood.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/stock");
    revalidatePath("/loja");
    return { success: true };
  } catch (error) {
    console.error("Toggle product error:", error);
    return { success: false, error: "Erro" };
  }
}

// ========== ORDER ACTIONS ==========

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    const updateData: any = { status: newStatus };
    
    if (newStatus === "COMPLETED") {
      updateData.pickedUpAt = new Date();
    }

    // If cancelling, restore stock
    if (newStatus === "CANCELLED") {
      const order = await db.dogFoodOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (order) {
        for (const item of order.items) {
          await db.dogFood.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }
    }

    await db.dogFoodOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/admin/stock");
    revalidatePath("/dashboard/loja");
    return { success: true };
  } catch (error) {
    console.error("Update order status error:", error);
    return { success: false, error: "Erro ao atualizar estado" };
  }
}

// ========== BRAND ACTIONS ==========

export async function createBrand(data: {
  name: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    await db.dogFoodBrand.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        description: data.description || null,
        website: data.website || null,
      },
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/stock/brands");
    return { success: true };
  } catch (error: any) {
    console.error("Create brand error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Marca já existe" };
    }
    return { success: false, error: "Erro ao criar marca" };
  }
}

export async function updateBrand(
  id: string,
  data: {
    name: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    isActive: boolean;
  }
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    await db.dogFoodBrand.update({
      where: { id },
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        description: data.description || null,
        website: data.website || null,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/stock/brands");
    return { success: true };
  } catch (error: any) {
    console.error("Update brand error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Marca já existe" };
    }
    return { success: false, error: "Erro ao atualizar marca" };
  }
}

export async function deleteBrand(id: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) return { success: false, error: "Sem permissões" };

    // Check if has products
    const products = await db.dogFood.count({ where: { brandId: id } });
    if (products > 0) {
      return { success: false, error: "Marca tem produtos associados" };
    }

    await db.dogFoodBrand.delete({ where: { id } });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/stock/brands");
    return { success: true };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, error: "Erro ao eliminar marca" };
  }
}
