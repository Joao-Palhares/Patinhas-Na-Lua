"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthCta() {
    const { user, isLoaded } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Avoid hydration mismatch by waiting for mount
    if (!mounted) {
        return (
            <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md opacity-50 cursor-wait">
                ...
            </button>
        );
    }

    if (!isLoaded) {
        return (
            <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md opacity-50 cursor-wait">
                ...
            </button>
        );
    }

    if (user) {
        return (
            <Link href="/dashboard">
                <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-black transition shadow-md">
                    Ir para Dashboard
                </button>
            </Link>
        );
    }

    return (
        <SignInButton mode="modal">
            <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-black transition shadow-md">
                Entrar / Registar
            </button>
        </SignInButton>
    );
}
