import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NetworkMapWrapper } from "@/components/NetworkMapWrapper";
import { fetchActiveNetwork } from "@/lib/network/fetch";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "operator";
  const network = await fetchActiveNetwork();

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">QuantumRoute Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {profile?.email ?? user.email} ·{" "}
              <span className="font-medium capitalize">{role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {role === "admin" && (
              <Button asChild variant="secondary">
                <Link href="/admin">Admin panel</Link>
              </Button>
            )}
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Road Network</span>
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-normal text-amber-800">
                Simulated demo data — not live traffic
              </span>
            </CardTitle>
            <CardDescription>
              {network
                ? `${network.label} · ${network.nodes.length} intersections, ${network.edges.length} road segments`
                : "No network generated yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {network ? (
              <NetworkMapWrapper network={network} />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground">
                {role === "admin"
                  ? "Go to the Admin panel to generate a network."
                  : "Waiting for an admin to generate a network."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
