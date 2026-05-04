import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";

const ALLOWED_FIELDS = [
  "name",
  "category",
  "cost",
  "type",
  "months",
  "included",
  "notes",
  "position",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) {
    if (k in body) patch[k] = body[k];
  }
  if (patch.type === "annual") patch.months = null;
  if ("cost" in patch) patch.cost = Number(patch.cost) || 0;
  if ("months" in patch && patch.months != null) {
    patch.months = Number(patch.months) || 12;
  }

  const admin = createServiceClient();
  const { data: before } = await admin
    .from("partners")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!before) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: after, error } = await admin
    .from("partners")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordChange({
    userId: user.id,
    table: "partners",
    recordId: params.id,
    action: "update",
    before,
    after,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createServiceClient();
  const { data: before } = await admin
    .from("partners")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!before) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("partners")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordChange({
    userId: user.id,
    table: "partners",
    recordId: params.id,
    action: "delete",
    before,
  });

  return NextResponse.json({ ok: true });
}
