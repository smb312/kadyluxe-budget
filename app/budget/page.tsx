import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { loadBudget } from "@/lib/data";
import BudgetTool from "@/components/BudgetTool";
import type { ShareLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { scenarios, bundle } = await loadBudget();

  const admin = createServiceClient();
  const { data: shareRows } = await admin
    .from("share_links")
    .select("token, created_at, expires_at, label")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const shareLinks: ShareLink[] = (shareRows ?? []).map((r) => ({
    token: String(r.token),
    created_at: String(r.created_at),
    expires_at: r.expires_at ? String(r.expires_at) : null,
    label: r.label ?? null,
  }));

  return (
    <BudgetTool
      scenarios={scenarios}
      initialBundle={bundle}
      initialShareLinks={shareLinks}
      userEmail={user.email ?? null}
      mode="edit"
    />
  );
}
