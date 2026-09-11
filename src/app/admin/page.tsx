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

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin access confirmed ✓</CardTitle>
            <CardDescription>
              Network management and traffic generation controls arrive in the
              next stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You&apos;re seeing this because your role is{" "}
            <span className="font-medium">admin</span>. An Operator visiting this
            URL is redirected to the dashboard.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
