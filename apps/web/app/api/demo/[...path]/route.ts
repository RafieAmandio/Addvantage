import { NextResponse, type NextRequest } from "next/server";
import { isMockMode } from "@/lib/config/public";
import { DemoApiMiss, demoApi } from "@/lib/mock/api";

export const dynamic = "force-dynamic";

// Mock mode only: the browser half of lib/mock/api.ts. 404 everywhere else.
async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!isMockMode()) return NextResponse.json({ success: false }, { status: 404 });
  try {
    const body = req.headers.get("content-type")?.includes("application/json") ? await req.json().catch(() => undefined) : undefined;
    const data = await demoApi(req.method, `/${params.path.join("/")}${req.nextUrl.search}`, body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    // Demo handlers can throw a real API status (e.g. 409) with the API's message.
    const e = err as { status?: number; apiMessage?: string };
    const status = e.status ?? (err instanceof DemoApiMiss ? 404 : 500);
    return NextResponse.json({ success: false, message: e.apiMessage ?? String(err) }, { status });
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
