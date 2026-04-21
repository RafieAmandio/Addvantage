import { supabaseServer } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config/public";

const MOCK_USER = {
  id: "demo-operator",
  email: "demo@tradevantage.local",
} as const;

const MOCK_PROFILE: ProfileSummary = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  handle: "demo-operator",
  is_admin: false,
  tier: "vip",
  signed_liability: true,
};

export async function getSession() {
  if (isMockMode()) return MOCK_USER as unknown as Awaited<ReturnType<typeof realGetUser>>;
  return realGetUser();
}

async function realGetUser() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export interface ProfileSummary {
  id: string;
  email: string | null;
  handle: string | null;
  is_admin: boolean;
  tier: string;
  signed_liability: boolean;
}

export async function getProfile(): Promise<ProfileSummary | null> {
  if (isMockMode()) return MOCK_PROFILE;
  const user = await getSession();
  if (!user) return null;
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,handle,is_admin,tier,signed_liability")
    .eq("id", user.id)
    .maybeSingle();
  return (data as ProfileSummary | null) ?? null;
}

export async function requireAdmin(): Promise<ProfileSummary> {
  const profile = await getProfile();
  if (!profile || !profile.is_admin) {
    throw new Error("Forbidden");
  }
  return profile;
}
