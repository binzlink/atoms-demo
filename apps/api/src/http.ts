const ALLOWED = [/^https:\/\/ai111\.ai$/, /^https:\/\/atoms-demo-bab\.pages\.dev$/, /^https:\/\/[a-z0-9]+\.atoms-demo-bab\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/];

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED.some((pattern) => pattern.test(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function readPrompt(request: Request): Promise<string | Response> {
  let body: { prompt?: unknown };
  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return json({ message: "请先描述你想做的应用" }, 400);
  }
  if (typeof body.prompt !== "string" || !body.prompt.trim()) {
    return json({ message: "请先描述你想做的应用" }, 400);
  }
  if (body.prompt.trim().length > 4000) return json({ message: "描述太长了，请收短一些" }, 400);
  return body.prompt.trim();
}

export function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...fields }));
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
