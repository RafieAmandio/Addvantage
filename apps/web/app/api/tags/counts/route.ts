import { NextResponse } from "next/server";
import { getTagCounts } from "@/features/tags/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
}
