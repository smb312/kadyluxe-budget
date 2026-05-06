import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MAX_PARTNERS_PER_STAGE } from "@/lib/team/types";

const VALID_STATUS = new Set(["confirmed", "recommended", "vision"]);

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const stageId = String(body.stage_id ?? "");
  if (!stageId) {
    return NextResponse.json({ error: "missing stage_id" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { count } = await admin
    .from("team_partners")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", stageId);

  if ((count ?? 0) >= MAX_PARTNERS_PER_STAGE) {
    return NextResponse.json(
      { error: `max ${MAX_PARTNERS_PER_STAGE} per stage` },
      { status: 400 },
    );
  }

  const status = VALID_STATUS.has(body.status) ? body.status : "recommended";
  const { data, error } = await admin
    .from("team_partners")
    .insert({
      stage_id: stageId,
      name: String(body.name ?? ""),
      partner: String(body.partner ?? ""),
      status,
      position: count ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "insert failed" },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}
