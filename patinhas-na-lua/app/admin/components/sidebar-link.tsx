"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string; // Allow custom styling
}

export default function SidebarLink({ href, icon, label, className }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition whitespace-nowrap", // whitespace-nowrap fixes line break
        isActive
          ? "bg-blue-600 text-white font-bold shadow-md" // Removed scale-105 to prevent layout shifts
          : "hover:bg-slate-800 text-slate-300 hover:text-white",
        className
      )}
    >
      <span className={cn(isActive ? "animate-pulse" : "")}>{icon}</span>
      {label}
    </Link>
  );
}
