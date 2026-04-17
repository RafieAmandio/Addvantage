import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const startedAt = Date.now();

type Check = { ok: true } | { ok: false; error: string };

async function checkSupabase(): Promise<Check> {
  try {
    const supabase = supabaseServer();
    const { error } = await supabase
      .from("sources")
      .select("code", { head: true, count: "exact" })
      .limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  const supabase = await checkSupabase();
  const ok = supabase.ok;
  const body = {
    ok,
    ts: new Date().toISOString(),
    app: "web",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    checks: { supabase },
  };
  if (!ok) logger.warn("health: degraded", body);
  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
