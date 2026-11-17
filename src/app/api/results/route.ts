import { resultsEnv, sanitizeAnswers, saveResult } from "@/server/results";

export const dynamic = "force-dynamic";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** POST { answers } -> { id }. The id is the evergreen /results/<id> link. */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 4096) return json({ error: "too large" }, 413);
  let body: { answers?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const answers = sanitizeAnswers(body?.answers);
  if (!answers) return json({ error: "invalid answers" }, 400);
  try {
    return json({ id: await saveResult(resultsEnv(), answers) }, 201);
  } catch (err) {
    console.error("[results]", err instanceof Error ? err.message : err);
    // The client falls back to the legacy link, so a storage outage never blocks lead capture.
    return json({ error: "storage unavailable" }, 503);
  }
}
