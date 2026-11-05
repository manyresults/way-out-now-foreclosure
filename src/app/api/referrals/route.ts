import { referralsHttp } from "@/server/notion";

// Always evaluated at request time; server/notion.ts keeps its own 5-minute cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const { status, headers, body } = await referralsHttp({
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_FREE_DB_ID: process.env.NOTION_FREE_DB_ID,
    NOTION_AFFILIATE_DB_ID: process.env.NOTION_AFFILIATE_DB_ID,
  });
  return new Response(body, { status, headers });
}
