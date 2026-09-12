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
import { GenerateNetworkControl } from "@/components/GenerateNetworkControl";
import { NetworkSelector } from "@/components/NetworkSelector";
import { NetworkMapWrapper } from "@/components/NetworkMapWrapper";
import { fetchActiveNetwork, listNetworks } from "@/lib/network/fetch";

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const network = await fetchActiveNetwork();
  const networks = await listNetworks();

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Network</CardTitle>
            <CardDescription>
              Choose which network the dashboard uses. The real OSM network and
              any generated grid are both available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetworkSelector networks={networks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Synthetic Network</CardTitle>
            <CardDescription>
              Generate a synthetic grid. This replaces any existing grid and
              becomes active. The real OSM network is preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateNetworkControl />
          </CardContent>
        </Card>

        {network && (
          <Card>
            <CardHeader>
              <CardTitle>Active Network Preview</CardTitle>
              <CardDescription>
                {network.label} · {network.nodes.length} intersections,{" "}
                {network.edges.length} segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkMapWrapper network={network} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
