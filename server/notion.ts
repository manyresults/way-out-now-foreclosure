import type { AffiliateProgram, FreeReferral, ReferralResponse } from "../src/lib/referralTypes";

export type NotionEnv = {
  NOTION_TOKEN?: string;
  NOTION_FREE_DB_ID?: string;
  NOTION_AFFILIATE_DB_ID?: string;
};

// Defaults point at the Way Out Now "Referral Databases" page.
const DEFAULT_FREE_DB_ID = "0fdf46f6-1576-4afa-b8be-daeb32b65b2e";
const DEFAULT_AFFILIATE_DB_ID = "3794087b-0f70-800d-81d4-c98b75042ac8";
const NOTION_VERSION = "2022-06-28";
const CACHE_TTL_MS = 5 * 60 * 1000;

type NotionRichText = { plain_text: string };
type NotionProperty = {
  type: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  url?: string | null;
  select?: { name: string } | null;
  status?: { name: string } | null;
};
type NotionPage = { properties: Record<string, NotionProperty> };

const text = (p?: NotionProperty): string => {
  if (!p) return "";
  const parts = p.type === "title" ? p.title : p.rich_text;
  return (parts ?? []).map((t) => t.plain_text).join("").trim();
};
const url = (p?: NotionProperty): string => (p?.url ?? "").trim();
const select = (p?: NotionProperty): string => (p?.select?.name ?? p?.status?.name ?? "").trim();

/** Strips leading emoji/symbols, e.g. "💵 Personal Loans" -> "Personal Loans". */
const stripEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();

async function queryDatabase(token: string, databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!res.ok) {
      throw new Error(`Notion ${res.status} for database ${databaseId}: ${(await res.text()).slice(0, 200)}`);
    }
    const json = (await res.json()) as { results: NotionPage[]; has_more: boolean; next_cursor: string | null };
    pages.push(...json.results);
    cursor = json.has_more && json.next_cursor ? json.next_cursor : undefined;
  } while (cursor);
  return pages;
}

export function parseFreeReferrals(pages: NotionPage[]): FreeReferral[] {
  return pages
    .map((page) => {
      const p = page.properties;
      return {
        name: text(p["Agency"]),
        type: select(p["Type"]),
        desc: text(p["Talking Point"]) || text(p["Description"]),
        link: url(p["Referral Action / Link"]),
      };
    })
    .filter((r) => r.name && r.link);
}

/** Only rows marked approved/live may be shown to homeowners. */
export const isApprovedStatus = (status: string) => /\b(approved|live)\b/i.test(status) && !/\bnot\b/i.test(status);

export function parseAffiliates(pages: NotionPage[]): AffiliateProgram[] {
  return pages
    .filter((page) => isApprovedStatus(select(page.properties["Status"]) || text(page.properties["Status"])))
    .map((page) => {
      const p = page.properties;
      return {
        name: text(p["Program Name"]),
        category: stripEmoji(select(p["Category"])),
        desc: text(p["Best For"]) || text(p["Description"]),
        link: url(p["Affiliate Link"]),
      };
    })
    .filter((r) => r.name && r.link);
}

let cache: { at: number; data: ReferralResponse } | null = null;
export const clearReferralCache = () => { cache = null; };

/** Throws if the token is missing or Notion fails; callers decide how to fall back. */
export async function fetchReferrals(env: NotionEnv): Promise<ReferralResponse> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const token = env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");

  const [freePages, affiliatePages] = await Promise.all([
    queryDatabase(token, env.NOTION_FREE_DB_ID || DEFAULT_FREE_DB_ID),
    queryDatabase(token, env.NOTION_AFFILIATE_DB_ID || DEFAULT_AFFILIATE_DB_ID),
  ]);
  const data: ReferralResponse = {
    freeReferrals: parseFreeReferrals(freePages),
    affiliates: parseAffiliates(affiliatePages),
    source: "notion",
    fetchedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), data };
  return data;
}

/** Shared HTTP behaviour for the Vercel function and the Vite dev middleware. */
export async function referralsHttp(env: NotionEnv): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  try {
    const data = await fetchReferrals(env);
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("[referrals]", err instanceof Error ? err.message : err);
    // Never leak details; the client falls back to its bundled defaults.
    return {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ error: "referral source unavailable" }),
    };
  }
}
