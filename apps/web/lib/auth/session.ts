import { cache } from "react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { isMockMode } from "@/lib/config/public";
import { apiGet } from "@/lib/api/client-server";

const MOCK_USER = {
  id: "demo-operator",
  email: "demo@tradevantage.local",
} as const;

const MOCK_PROFILE: ProfileSummary = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  handle: "demo-operator",
  is_admin: true,
  tier: "vip",
  signed_liability: true,
};

interface SessionUser {
  id: string;
  email: string;
}

export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  if (isMockMode()) return MOCK_USER;

  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const id = payload.sub;
    const email = (payload.email as string) ?? "";
    if (!id) return null;
    return { id, email };
  } catch {
    return null;
  }
});

interface ProfileSummary {
  id: string;
  email: string | null;
  handle: string | null;
  is_admin: boolean;
  tier: string;
  signed_liability: boolean;
}

export const getProfile = cache(async function getProfile(): Promise<ProfileSummary | null> {
  if (isMockMode()) return MOCK_PROFILE;
  const user = await getSession();
  if (!user) return null;
  try {
    return await apiGet<ProfileSummary>("/users/me");
  } catch {
    return null;
  }
});

export async function requireAdmin(): Promise<ProfileSummary> {
  const profile = await getProfile();
  if (!profile || !profile.is_admin) {
    throw new Error("Forbidden");
  }
  return profile;
}
