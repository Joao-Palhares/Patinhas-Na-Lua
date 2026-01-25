import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import AuthCta from "@/app/components/auth-cta";
import ProductGrid from "./product-grid";

export const metadata = {
  title: "Loja | Patinhas na Lua",
  description: "Alimentação premium para cães e gatos. Marcas de qualidade como Ownat, com entrega rápida.",
};

export default async function ShopPage() {
  const user = await currentUser();
  let isAdmin = false;
  let isLoggedIn = false;

  if (user) {
    isLoggedIn = true;
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (dbUser?.isAdmin) isAdmin = true;
  }

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

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Patinhas na Lua Logo" width={40} height={40} className="rounded-lg" priority />
            <span className="font-serif font-bold text-lg tracking-tight text-primary">Patinhas na Lua</span>
          </Link>

          <div className="hidden md:flex gap-8 text-sm font-medium text-foreground">
            <Link href="/" className="hover:text-primary transition">Início</Link>
            <Link href="/#servicos" className="hover:text-primary transition">Serviços</Link>
            <Link href="/loja" className="text-primary font-bold">Loja</Link>
            <Link href="/#agendar" className="hover:text-primary transition">Agendar</Link>
            {isAdmin && (
              <Link href="/admin/appointments" className="text-primary font-bold hover:text-primary-hover border border-primary/20 px-3 py-1 rounded-full text-xs">
                Área Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <AuthCta />
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 mb-12">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-primary/20">
              🛒 Loja Online
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-primary mb-4">
              Alimentação Premium
            </h1>
            <p className="text-lg text-foreground max-w-2xl mx-auto">
              Rações de qualidade superior para o seu melhor amigo. Encomende online e levante na loja!
            </p>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="max-w-6xl mx-auto px-4">
          <ProductGrid 
            products={products} 
            brands={brands} 
            isLoggedIn={isLoggedIn} 
          />
        </section>

        {/* CTA */}
        {!isLoggedIn && (
          <section className="max-w-4xl mx-auto px-4 mt-16 text-center">
            <div className="bg-primary-light rounded-2xl p-8 border border-primary/20">
              <h2 className="text-2xl font-serif font-bold text-primary mb-4">
                Quer encomendar?
              </h2>
              <p className="text-foreground mb-6">
                Crie uma conta gratuita para fazer encomendas e acompanhar os seus pedidos.
              </p>
              <Link href="/dashboard">
                <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-hover transition">
                  Criar Conta / Entrar
                </button>
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 text-center">
        <p className="text-sm font-bold text-primary">Patinhas na Lua</p>
        <div className="flex gap-4 justify-center text-xs text-gray-500 mt-2">
          <p>© 2025. Todos os direitos reservados.</p>
          <Link href="/terms" className="hover:underline">Termos e Condições</Link>
        </div>
      </footer>
    </div>
  );
}
