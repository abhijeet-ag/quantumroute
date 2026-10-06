"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/validation", label: "Validation" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/equilibrium", label: "Equilibrium" },
  { href: "/exact", label: "Exact" },
];

export function HeaderNav() {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {ITEMS.map((it) => {
        const active = path === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-cyan-500/15 text-cyan-300"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
