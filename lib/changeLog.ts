import { createServiceClient } from "@/lib/supabase/server";

export type ChangeAction = "create" | "update" | "delete";

export const recordChange = async (params: {
  userId: string;
  table: string;
  recordId: string;
  action: ChangeAction;
  before?: unknown;
  after?: unknown;
}) => {
  const admin = createServiceClient();
  await admin.from("change_log").insert({
    user_id: params.userId,
    table_name: params.table,
    record_id: params.recordId,
    action: params.action,
    before: params.before ?? null,
    after: params.after ?? null,
  });
};
