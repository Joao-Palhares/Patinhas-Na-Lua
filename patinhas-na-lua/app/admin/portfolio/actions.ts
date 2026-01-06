"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function uploadPortfolioImage(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) throw new Error("Unauthorized");

    const url = formData.get("url") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const lastImage = await db.portfolioImage.findFirst({
        orderBy: { order: 'desc' },
    });

    await db.portfolioImage.create({
        data: {
            url,
            title: title || null,
            description: description || null,
            order: (lastImage?.order ?? 0) + 1,
        },
    });

    revalidatePath("/admin/portfolio");
    revalidatePath("/");
    return { success: true };
}

export async function deletePortfolioImage(id: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) throw new Error("Unauthorized");

    await db.portfolioImage.delete({ where: { id } });

    revalidatePath("/admin/portfolio");
    revalidatePath("/");
    return { success: true };
}

export async function togglePortfolioImageVisibility(id: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) throw new Error("Unauthorized");

    const image = await db.portfolioImage.findUnique({ where: { id } });
    if (!image) throw new Error("Image not found");

    await db.portfolioImage.update({
        where: { id },
        data: { isPublic: !image.isPublic },
    });

    revalidatePath("/admin/portfolio");
    revalidatePath("/");
    return { success: true };
}

export async function updatePortfolioImageOrder(id: string, direction: 'up' | 'down') {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) throw new Error("Unauthorized");

    const image = await db.portfolioImage.findUnique({ where: { id } });
    if (!image) throw new Error("Image not found");

    const allImages = await db.portfolioImage.findMany({
        orderBy: { order: 'asc' },
    });

    const currentIndex = allImages.findIndex(img => img.id === id);
    if (currentIndex === -1) throw new Error("Image not found");

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= allImages.length) {
        return { success: false, message: "Cannot move further" };
    }

    const swapImage = allImages[swapIndex];

    // Swap orders
    await db.portfolioImage.update({
        where: { id: image.id },
        data: { order: swapImage.order },
    });

    await db.portfolioImage.update({
        where: { id: swapImage.id },
        data: { order: image.order },
    });

    revalidatePath("/admin/portfolio");
    return { success: true };
}
