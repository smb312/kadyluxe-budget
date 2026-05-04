import { notFound } from "next/navigation";
import { fetchBundleForShareToken } from "@/lib/data";
import BudgetTool from "@/components/BudgetTool";

export const dynamic = "force-dynamic";

export default async function ViewPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await fetchBundleForShareToken(params.token);
  if (!data) notFound();

  return (
    <BudgetTool
      initialBundle={data.bundle}
      initialShareLinks={[]}
      userEmail={data.ownerEmail}
      mode="view"
    />
  );
}
