import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
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
    <div className="grid items-start gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-2">
        <Panel
          title="Change password"
          sub="Signed in with a temporary password from your welcome email? Set a new one here."
        >
          <ChangePasswordForm />
        </Panel>
        <Panel title="Privacy">
          <MentionPreferenceToggle initial={allowMention} />
        </Panel>
    </div>
  );
}
