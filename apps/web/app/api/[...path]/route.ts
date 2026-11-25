import { NextResponse, type NextRequest } from "next/server";

const API_ORIGIN = (process.env.API_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 60_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const target = new URL(`${API_ORIGIN}/api/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");
  if (accept) headers.set("accept", accept);
  if (contentType) headers.set("content-type", contentType);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      redirect: "manual"
    });

    const responseHeaders = new Headers();
    for (const key of ["content-type", "x-request-id", "retry-after", "cache-control"]) {
      const value = upstream.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    if (!responseHeaders.has("cache-control")) {
      responseHeaders.set("cache-control", "no-store");
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        error: timedOut
          ? "The API timed out. Please try again."
          : "The API is unreachable. Please try again shortly.",
        code: timedOut ? "api_timeout" : "api_unreachable"
      },
      { status: 504 }
    );
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
  forward as OPTIONS
};
