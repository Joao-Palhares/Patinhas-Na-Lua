"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: string;
  label: string;
}

export default function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition",
        isActive
          ? "bg-blue-600 text-white font-bold shadow-md transform scale-105"
          : "hover:bg-slate-800 text-slate-300 hover:text-white"
      )}
    >
      <span className={cn(isActive ? "animate-pulse" : "")}>{icon}</span>
      {label}
    </Link>
  );
}
