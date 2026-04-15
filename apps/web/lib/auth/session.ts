import { supabaseServer } from "@/lib/supabase/server";

export async function getSession() {
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
