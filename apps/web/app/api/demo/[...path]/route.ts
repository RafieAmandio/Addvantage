import { NextResponse, type NextRequest } from "next/server";
import { isMockMode } from "@/lib/config/public";
import { DemoApiMiss, demoApi } from "@/lib/mock/api";

export const dynamic = "force-dynamic";

// Mock mode only: the browser half of lib/mock/api.ts. 404 everywhere else.
async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!isMockMode()) return NextResponse.json({ success: false }, { status: 404 });
  try {
    const data = await demoApi(req.method, `/${params.path.join("/")}${req.nextUrl.search}`);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: err instanceof DemoApiMiss ? 404 : 500 });
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
