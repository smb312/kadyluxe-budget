import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/budget");

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="grain relative w-full max-w-md bg-white border border-black/10 rounded p-8">
        <div className="mono-font text-[11px] tracking-[0.15em] uppercase text-black/50 mb-2">
          KADYLUXE × COAST / FRACTIONAL CMO
        </div>
        <h1 className="display-font text-3xl font-medium leading-none tracking-tight mb-3">
          Sign in
        </h1>
        <p className="text-sm text-black/60 mb-6 leading-relaxed">
          Email and password. Sign up if you&apos;re new.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
