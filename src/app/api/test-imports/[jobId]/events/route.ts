import { NextResponse } from "next/server";

import { getSession } from "@/app/(authentication)/_lib/session";
import { backendUrl } from "@/lib/api/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

/**
 * Same-origin SSE bridge for import progress.
 *
 * The browser authenticates with the encrypted httpOnly Dwelve session. Only
 * this server-side handler sees the backend bearer token, preserving the same
 * client/server boundary as every other authenticated request in the app.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const session = await getSession();

  if (!session?.accessToken) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { jobId } = await params;
  const upstream = await fetch(
    backendUrl(`/tests/imports/${encodeURIComponent(jobId)}/events`),
    {
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${session.accessToken}`,
        "X-Request-Id": crypto.randomUUID(),
      },
      cache: "no-store",
      signal: request.signal,
    },
  );

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { message: "Could not open the import progress stream" },
      { status: upstream.status || 502 },
    );
  }

  const headers = new Headers({
    "Cache-Control": "no-cache, no-transform",
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
  });
  const requestId = upstream.headers.get("X-Request-Id");

  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  return new Response(upstream.body, { status: 200, headers });
}
