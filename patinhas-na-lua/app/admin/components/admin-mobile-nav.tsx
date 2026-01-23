"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
    children?: React.ReactNode;
    isSuperAdmin?: boolean;
}

export default function AdminMobileNav({ children, isSuperAdmin = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggle = () => setIsOpen(!isOpen);

    const LINKS = [
        { href: "/admin/appointments", icon: "📅", label: "Agenda / Marcações" },
        { href: "/admin/clients", icon: "👥", label: "Clientes" },
        { href: "/admin/services", icon: "✂️", label: "Serviços e Preços" },
        { href: "/admin/expenses", icon: "💶", label: "Despesas" },
        { href: "/admin/analytics", icon: "📈", label: "Relatórios & Lucro" },
        { href: "/admin/coupons", icon: "🎟️", label: "Prémios & Cupões" },
        { href: "/admin/fees", icon: "🏷️", label: "Taxas Extras" },
        { href: "/admin/invoices", icon: "🧾", label: "Faturas" },
        { href: "/admin/settings", icon: "⚙️", label: "Configuração" },
        { href: "/admin/vacations", icon: "🏖️", label: "Férias" },
        { href: "/admin/marketing", icon: "✨", label: "Estúdio Criativo" },
        { href: "/admin/portfolio", icon: "🖼️", label: "Portfólio (Site)" },
        { href: "/admin/reviews", icon: "⭐", label: "Moderação Reviews" },
    ];


    return (
        <div className="md:hidden">

            {/* TOP BAR */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
                <button onClick={toggle} className="p-2 -ml-2 text-2xl font-bold leading-none">
                    {isOpen ? "✕" : "☰"}
                </button>
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Admin" width={24} height={24} className="rounded" />
                    <span className="font-bold tracking-wider text-sm">ADMIN</span>
                </div>
                <Link href="/admin/scan">
                    <button className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        📷 <span className="hidden xs:inline">Scan</span>
                    </button>
                </Link>
            </div>

            {/* OVERLAY BACKDROP */}
            {isOpen && (
                <div
                    onClick={toggle}
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                ></div>
            )}

            {/* SIDEBAR DRAWER */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Patinhas na Lua" width={32} height={32} className="rounded-lg" />
                        <div>
                            <h2 className="text-xl font-bold text-blue-400 tracking-wider">ADMIN</h2>
                            <p className="text-xs text-slate-400">Menu Completo</p>
                        </div>
                    </div>
                    <button onClick={toggle} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {LINKS.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                            >
                                <span className="text-xl">{link.icon}</span>
                                <span className="font-medium text-sm">{link.label}</span>
                            </Link>
                        );
                    })}
                    
                    {/* SuperAdmin Only - Logs */}
                    {isSuperAdmin && (
                        <Link
                            href="/admin/logs"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === "/admin/logs" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                        >
                            <span className="text-xl">📜</span>
                            <span className="font-medium text-sm">Logs do Sistema</span>
                        </Link>
                    )}
                    
                    {children}
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
                    <Link href="/dashboard" className="block w-full p-3 text-center text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition border border-slate-700">
                        ← Voltar ao Site
                    </Link>
                </div>
            </div>

        </div>
    );
}
