import { createServiceClient } from "@/lib/supabase/server";

export const recordChange = async (params: {
  scenarioId: string | null;
  userEmail: string | null;
  action: string;
  details: Record<string, unknown>;
}) => {
  // change_log requires scenario_id; skip if we don't have one (e.g. share-link mutations).
  if (!params.scenarioId) return;

  const admin = createServiceClient();
  const { error } = await admin.from("change_log").insert({
    scenario_id: params.scenarioId,
    user_email: params.userEmail,
    action: params.action,
    details: params.details,
  });
  if (error) console.error("change_log insert error", error);
};
