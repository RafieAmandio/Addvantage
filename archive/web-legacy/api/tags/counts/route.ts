import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getTagCounts } from "@/features/tags/queries";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const counts = await getTagCounts();
    return NextResponse.json(
      { counts },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: "api.tags.counts" } });
    logger.error("/api/tags/counts failed", { error: err, scope: "api.tags.counts" });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
