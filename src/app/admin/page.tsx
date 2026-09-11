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
import { NetworkMapWrapper } from "@/components/NetworkMapWrapper";
import { fetchActiveNetwork } from "@/lib/network/fetch";

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
            <CardTitle>Demo Network</CardTitle>
            <CardDescription>
              Generate a synthetic road network. This replaces any existing
              network and clears its old traffic and runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GenerateNetworkControl />
            <div className="rounded-md border bg-background p-3 text-sm">
              {network ? (
                <>
                  <span className="font-medium">Active network:</span>{" "}
                  {network.label} · {network.nodes.length} intersections,{" "}
                  {network.edges.length} segments
                </>
              ) : (
                <span className="text-muted-foreground">
                  No network yet — generate one above.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {network && (
          <Card>
            <CardHeader>
              <CardTitle>Network Preview</CardTitle>
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
