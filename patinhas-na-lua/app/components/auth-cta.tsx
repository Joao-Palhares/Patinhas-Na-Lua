"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "./skeleton";

export default function AuthCta() {
    const { user, isLoaded } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Avoid hydration mismatch by waiting for mount
    if (!mounted) {
        return (
            <Skeleton className="h-9 w-32 rounded-full opacity-50" />
        );
    }

    if (!isLoaded) {
        return (
            <Skeleton className="h-9 w-32 rounded-full opacity-50" />
        );
    }

    if (user) {
        return (
            <Link href="/dashboard">
                <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-primary-hover transition shadow-md">
                    Ir para Dashboard
                </button>
            </Link>
        );
    }

    return (
        <SignInButton mode="modal">
            <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-primary-hover transition shadow-md">
                Entrar / Registar
            </button>
        </SignInButton>
    );
}
