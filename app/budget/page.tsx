import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchBundleForUser } from "@/lib/data";
import BudgetTool from "@/components/BudgetTool";
import type { ShareLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bundle = await fetchBundleForUser(user.id);

  const admin = createServiceClient();
  const { data: shareRows } = await admin
    .from("share_links")
    .select("token, created_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const shareLinks: ShareLink[] = (shareRows ?? []).map((r) => ({
    token: String(r.token),
    created_at: String(r.created_at),
    revoked_at: r.revoked_at ? String(r.revoked_at) : null,
  }));

  return (
    <BudgetTool
      initialBundle={bundle}
      initialShareLinks={shareLinks}
      userEmail={user.email ?? null}
      mode="edit"
    />
  );
}
