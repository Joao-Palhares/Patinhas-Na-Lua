import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CouponQRCode from "./coupon-qr-code";

export default async function MyCouponsPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const dbUser = await db.user.findUnique({
        where: { id: user.id },
        include: {
            coupons: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!dbUser) redirect("/onboarding");

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* HEADER */}
            <div className="bg-slate-900 text-white pt-12 pb-24 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
                    <div>
                        <Link href="/dashboard" className="text-slate-300 text-sm font-bold hover:text-white transition flex items-center gap-1 mb-2">
                            ← Voltar
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black mb-2">Meus Cupões 🎟️</h1>
                        <p className="text-slate-300 opacity-90 max-w-sm">
                            Aqui estão os seus prémios desbloqueados. Apresente o código na loja!
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20 space-y-6">

                {/* ACTIVE COUPONS */}
                {dbUser.coupons.filter(c => c.active).length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                        <p className="text-6xl mb-4">🤷‍♂️</p>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Sem cupões ativos</h3>
                        <p className="text-gray-500 mb-6">Troque as suas Patinhas por prémios!</p>
                        <Link href="/dashboard/rewards">
                            <button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition">
                                Ir para o Clube Patinhas 🐾
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dbUser.coupons.filter(c => c.active).map(coupon => (
                            <div key={coupon.id} className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                                {/* Decorative Circle */}
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border-r border-gray-200"></div>
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border-l border-gray-200"></div>

                                <div className="text-center md:text-left">
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
                                        Disponível
                                    </span>
                                    <h3 className="text-xl font-black text-gray-800 tracking-wider font-mono">
                                        {coupon.code}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Desconto de {coupon.discount}%
                                    </p>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <CouponQRCode code={coupon.code} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HISTORY (USED) */}
                {dbUser.coupons.filter(c => !c.active).length > 0 && (
                    <div className="pt-8">
                        <h3 className="text-lg font-bold text-gray-600 mb-4 px-2">Histórico</h3>
                        <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 transition duration-500">
                            {dbUser.coupons.filter(c => !c.active).map(coupon => (
                                <div key={coupon.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-500 line-through font-mono">{coupon.code}</p>
                                        <p className="text-xs text-gray-400">
                                            Usado em: {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString('pt-PT') : "N/A"}
                                        </p>
                                    </div>
                                    <span className="bg-gray-200 text-gray-500 text-xs font-bold px-2 py-1 rounded">
                                        USADO
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
