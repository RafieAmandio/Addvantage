import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/session";
import { PlanRowSchema, type Plan } from "@/features/plan/types";

/**
 * Explicit SELECT column list for `trading_plans`. Never use `select('*')` —
 * a schema drift would otherwise silently poison the view. Keep aligned with
 * `PlanRowSchema` in `features/plan/types.ts`.
 */
const PLAN_COLUMNS =
  "id,symbol,thesis,direction,entry,stop,target,r_multiple,setups,tags,tier,status,outcome,author_id,created_at,updated_at,published_at,closed_at";

const DEFAULT_LIST_LIMIT = 50;

export interface ListPublishedPlansInput {
  limit?: number;
  symbol?: string;
}

/**
 * Public plan feed: `status='published'`, newest first. RLS already restricts
 * non-admins to published rows; the explicit `.eq` is kept for intent + to
 * exclude drafts/closed when an admin hits this function.
 */
export async function listPublishedPlans(
  input: ListPublishedPlansInput = {},
): Promise<Plan[]> {
  const limit = input.limit ?? DEFAULT_LIST_LIMIT;
  const supabase = supabaseServer();
  let query = supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(0, limit - 1);
  if (input.symbol) query = query.eq("symbol", input.symbol);

  const { data, error } = await query;
  if (error) {
    logger.error("listPublishedPlans failed", {
      error,
      scope: "plan.listPublishedPlans",
    });
    return [];
  }
  const parsed = PlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listPublishedPlans shape mismatch", {
      issues: parsed.error.issues,
      scope: "plan.listPublishedPlans",
    });
    return [];
  }
  return parsed.data;
}

/**
 * Single plan by id. Returns null on miss or parse failure. Admins see any
 * status (RLS); non-admins only see `published` rows (policy in 0021).
 */
export async function getPlanById(id: string): Promise<Plan | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error("getPlanById failed", {
      id,
      error,
      scope: "plan.getPlanById",
    });
    return null;
  }
  if (!data) return null;
  const parsed = PlanRowSchema.safeParse(data);
  if (!parsed.success) {
    logger.error("getPlanById shape mismatch", {
      id,
      issues: parsed.error.issues,
      scope: "plan.getPlanById",
    });
    return null;
  }
  return parsed.data;
}

export interface ListMyDraftPlansInput {
  limit?: number;
}

/**
 * Admin-only: drafts + closed plans authored by the current admin user.
 * Calls `requireAdmin()` up front so non-admins throw `Forbidden` before any
 * DB round-trip. Used by the authoring UI (P3) — `published` plans are
 * excluded because those are owned by the public feed route.
 */
export async function listMyDraftPlans(
  input: ListMyDraftPlansInput = {},
): Promise<Plan[]> {
  const admin = await requireAdmin();
  const limit = input.limit ?? DEFAULT_LIST_LIMIT;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("author_id", admin.id)
    .in("status", ["draft", "closed"])
    .order("updated_at", { ascending: false })
    .range(0, limit - 1);
  if (error) {
    logger.error("listMyDraftPlans failed", {
      error,
      scope: "plan.listMyDraftPlans",
    });
    return [];
  }
  const parsed = PlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listMyDraftPlans shape mismatch", {
      issues: parsed.error.issues,
      scope: "plan.listMyDraftPlans",
    });
    return [];
  }
  return parsed.data;
}
