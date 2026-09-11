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

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">QuantumRoute Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {profile?.email ?? user.email} ·{" "}
              <span className="font-medium capitalize">{role}</span>
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stage 1 complete ✓</CardTitle>
            <CardDescription>
              Auth, roles, and the database are working. The map, metrics, and
              optimization engine arrive in the next stages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Your role is{" "}
              <span className="font-medium capitalize">{role}</span>.{" "}
              {role === "admin"
                ? "You'll be able to manage the network and generate traffic."
                : "Operators can view the dashboard and run optimization."}
            </p>
            {role === "admin" && (
              <Button asChild variant="secondary">
                <Link href="/admin">Go to Admin panel</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
