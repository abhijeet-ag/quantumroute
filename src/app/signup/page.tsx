"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) { router.push("/dashboard"); router.refresh(); }
    else setMessage("Account created. If email confirmation is on, check your inbox, then log in.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500 font-mono text-lg font-bold text-slate-950">
            Q
          </span>
          <div>
            <div className="text-lg font-semibold text-slate-100">QuantumRoute</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">
              SIH26137 · Traffic Optimization
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-lg font-semibold text-slate-100">Create account</h1>
          <p className="mb-4 text-sm text-slate-400">You&apos;ll sign up as an Operator by default.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-cyan-400">{message}</p>}
            <Button onClick={handleSignup} disabled={loading}
              className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              {loading ? "Creating…" : "Sign up"}
            </Button>
            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
