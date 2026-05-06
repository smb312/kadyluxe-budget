import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBudget } from "@/lib/data";
import { loadCashflowAssumptions } from "@/lib/cashflow/data";
import CashflowTool from "@/components/CashflowTool";

export const dynamic = "force-dynamic";

export default async function CashflowPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [budget, assumptions] = await Promise.all([
    loadBudget(),
    loadCashflowAssumptions(user.id),
  ]);

  return (
    <CashflowTool
      scenarios={budget.scenarios}
      bundle={budget.bundle}
      initialAssumptions={assumptions}
      userEmail={user.email ?? null}
    />
  );
}
