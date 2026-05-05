import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const generateToken = () => randomBytes(18).toString("base64url");

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
    .insert({ created_by: user.id, token })
    .select("token, created_at, expires_at, label")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "create failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    token: String(data.token),
    created_at: String(data.created_at),
    expires_at: data.expires_at ? String(data.expires_at) : null,
    label: data.label ?? null,
  });
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
  // Revoke = expire now.
  const { error } = await admin
    .from("share_links")
    .update({ expires_at: new Date().toISOString() })
    .eq("token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
