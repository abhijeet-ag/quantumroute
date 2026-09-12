import Link from "next/link";

// Dark technical header with cyan accent. Monospace product tag.
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
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-sm text-slate-400 sm:inline">
              {email}
              {role && (
                <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-medium capitalize text-cyan-400">
                  {role}
                </span>
              )}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
