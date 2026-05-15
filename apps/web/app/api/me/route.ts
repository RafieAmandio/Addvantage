import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/session";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ is_admin: false });
  return NextResponse.json({ is_admin: profile.is_admin, tier: profile.tier });
}
