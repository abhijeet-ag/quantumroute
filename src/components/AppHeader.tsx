import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";

// Dark technical header with cyan accent + primary nav.
export function AppHeader({
  email,
  role,
  right,
}: {
  email?: string;
  role?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500 font-mono text-sm font-bold text-slate-950">
              Q
            </span>
            <div className="leading-tight">
              <div className="font-semibold text-slate-100">QuantumRoute</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">
                SIH26137 · Traffic Optimization
              </div>
            </div>
          </Link>
          <HeaderNav />
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className="hidden rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-medium capitalize text-cyan-400 sm:inline">
              {role}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
