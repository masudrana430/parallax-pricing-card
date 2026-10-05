import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const allowed = new Set([
    "health",
    "auth",
    "me",
    "profile",
    "dashboard",
    "observations",
    "assistant",
    "reports",
    "protocols",
    "transcribe",
    "export",
  ]);
  if (!allowed.has(path[0]) || path.some((p) => !/^[a-zA-Z0-9_-]+$/.test(p)))
    return Response.json({ detail: "Not found" }, { status: 404 });
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_ORIGIN || request.nextUrl.origin;
    if (origin && origin !== expected)
      return Response.json(
        { detail: "Invalid request origin" },
        { status: 403 },
      );
  }
  const headers = new Headers();
  for (const name of ["content-type", "cookie"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 11 * 1024 * 1024)
    return Response.json({ detail: "Request too large" }, { status: 413 });
  try {
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer();
    if (body && body.byteLength > 11 * 1024 * 1024)
      return Response.json({ detail: "Request too large" }, { status: 413 });
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/${path.join("/")}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(45000),
      },
    );
    const outgoing = new Headers({
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of response.headers.getSetCookie())
      outgoing.append("set-cookie", cookie);
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    return Response.json(
      {
        detail:
          "The health service is unavailable. No report was saved. Try again; seek medical help directly for urgent symptoms.",
      },
      { status: 503 },
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PUT };
