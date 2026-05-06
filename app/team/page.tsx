import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTeam } from "@/lib/team/data";
import TeamArchitecture from "@/components/TeamArchitecture";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const team = await loadTeam();

  return (
    <TeamArchitecture
      initial={team}
      userEmail={user.email ?? null}
      mode="edit"
    />
  );
}
