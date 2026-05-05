import { notFound } from "next/navigation";
import { loadBudgetForShareToken } from "@/lib/data";
import BudgetTool from "@/components/BudgetTool";

export const dynamic = "force-dynamic";

export default async function ViewPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await loadBudgetForShareToken(params.token);
  if (!result) notFound();

  return (
    <BudgetTool
      scenarios={result.data.scenarios}
      initialBundle={result.data.bundle}
      initialShareLinks={[]}
      userEmail={result.ownerEmail}
      mode="view"
    />
  );
}
