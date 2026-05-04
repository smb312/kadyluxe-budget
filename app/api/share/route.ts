import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";

const generateToken = () =>
  randomBytes(18).toString("base64url"); // ~24 chars, URL-safe

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = generateToken();
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("share_links")
    .insert({ user_id: user.id, token })
    .select("token, created_at, revoked_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "create failed" },
      { status: 500 },
    );
  }

  await recordChange({
    userId: user.id,
    table: "share_links",
    recordId: data.token,
    action: "create",
    after: data,
  });

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const admin = createServiceClient();
  const { error } = await admin
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordChange({
    userId: user.id,
    table: "share_links",
    recordId: token,
    action: "update",
    after: { revoked: true },
  });

  return NextResponse.json({ ok: true });
}
