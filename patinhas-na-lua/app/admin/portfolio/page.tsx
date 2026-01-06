import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import PortfolioManager from "./portfolio-manager";

export default async function PortfolioPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) redirect("/dashboard");

    const images = await db.portfolioImage.findMany({
        orderBy: { order: 'asc' },
    });

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Portfólio de Trabalhos</h1>
                <p className="text-slate-600 mt-2">
                    Gira a galeria de fotos que aparece na página principal. As imagens são guardadas gratuitamente no Cloudinary.
                </p>
            </div>

            <PortfolioManager initialImages={images} />
        </div>
    );
}
