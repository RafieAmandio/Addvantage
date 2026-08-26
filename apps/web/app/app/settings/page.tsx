import type { Metadata } from "next";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { MentionPreferenceToggle } from "@/features/auth/components/MentionPreferenceToggle";
import { apiGet } from "@/lib/api/client-server";

export const metadata: Metadata = { title: "Settings" };

async function getAllowMention(): Promise<boolean> {
  try {
    const me = await apiGet<{ allowMention?: boolean }>("/users/me");
    return me.allowMention ?? true;
  } catch {
    return true;
  }
}

export default async function SettingsPage() {
  const allowMention = await getAllowMention();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
        Account · Security
      </span>
      <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">Settings</h1>
      <p className="mt-3 max-w-xl font-mono text-sm text-white/50">
        Update your password. If you signed in with a temporary password from your welcome
        email, set a new one here.
      </p>

      <div className="mt-8 h-px bg-white/15" />

      <section className="mt-10">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest2 text-white/70">
          Change password
        </h2>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>

      <div className="mt-10 h-px bg-white/15" />

      <section className="mt-10">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest2 text-white/70">
          Privacy
        </h2>
        <div className="mt-6">
          <MentionPreferenceToggle initial={allowMention} />
        </div>
      </section>
    </div>
  );
}
