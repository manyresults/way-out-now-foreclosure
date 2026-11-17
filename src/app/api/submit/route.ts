import { generateResults, resultHeader } from "@/lib/routing";
import { defaultReferrals } from "@/data/defaultReferrals";
import { fetchReferrals } from "@/server/notion";
import { resultsEnv, sanitizeAnswers, saveResult } from "@/server/results";
import { buildLeadPayload, sanitizeAttribution, sanitizeContact, sendToGhl } from "@/server/lead";

export const dynamic = "force-dynamic";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function originOf(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

/**
 * The quiz form posts here. In order: validate, save the answers under a /results/<id> link, send the lead to
 * GoHighLevel, and tell the browser where to go. If GHL cannot be reached the visitor sees an error and can retry,
 * so a lead is never silently dropped.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 8192) return json({ error: "too large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend it worked so bots don't adapt.
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ redirect: "/" }, 200);

  const contact = sanitizeContact(body.contact);
  const answers = sanitizeAnswers(body.answers);
  if (!contact || !answers) return json({ error: "invalid submission" }, 400);

  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[submit] GHL_WEBHOOK_URL is not set; refusing to accept a lead that cannot be delivered");
    return json({ error: "lead delivery not configured" }, 503);
  }

  // Evergreen link; falls back to the self-contained legacy link if storage is down.
  let resultsId: string | null = null;
  try {
    resultsId = await saveResult(resultsEnv(), answers);
  } catch (err) {
    console.error("[submit] results storage failed, using legacy link:", err instanceof Error ? err.message : err);
  }
  const resultsPath = resultsId
    ? `/results/${resultsId}`
    : `/thank-you?data=${encodeURIComponent(Buffer.from(JSON.stringify(answers)).toString("base64"))}`;

  let catalog = defaultReferrals;
  try {
    catalog = await fetchReferrals({
      NOTION_TOKEN: process.env.NOTION_TOKEN,
      NOTION_FREE_DB_ID: process.env.NOTION_FREE_DB_ID,
      NOTION_AFFILIATE_DB_ID: process.env.NOTION_AFFILIATE_DB_ID,
    });
  } catch {
    // Notion unavailable: the same fallback snapshot the results page uses.
  }
  const results = generateResults(answers, catalog);

  const payload = buildLeadPayload({
    contact,
    answers,
    attribution: sanitizeAttribution(body.attribution),
    resultsUrl: `${originOf(request)}${resultsPath}`,
    resultsId,
    header: resultHeader(answers),
    resources: results.resources,
    affiliates: results.affiliates,
  });

  try {
    await sendToGhl(webhookUrl, payload);
  } catch (err) {
    console.error("[submit] GHL delivery failed:", err instanceof Error ? err.message : err);
    return json({ error: "could not deliver" }, 502);
  }
  return json({ redirect: resultsPath }, 200);
}
