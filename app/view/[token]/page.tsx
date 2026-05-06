import { notFound } from "next/navigation";
import { loadBudget, validateShareToken } from "@/lib/data";
import { loadTeam } from "@/lib/team/data";
import TabbedView from "./TabbedView";

export const dynamic = "force-dynamic";

export default async function ViewPage({
  params,
}: {
  params: { token: string };
}) {
  const meta = await validateShareToken(params.token);
  if (!meta) notFound();

  const [budget, team] = await Promise.all([loadBudget(), loadTeam()]);

  return (
    <TabbedView
      ownerEmail={meta.ownerEmail}
      budget={budget}
      team={team}
    />
  );
}
