import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultReferrals } from "@/data/defaultReferrals";
import { pickAffiliates, pickResources, resourceTypes } from "@/lib/routing";
import { clearReferralCache, fetchReferrals, isApprovedStatus, parseAffiliates, parseFreeReferrals } from "../server/notion";
import { RESULT_ID_RE, loadResult, sanitizeAnswers, saveResult } from "../server/results";

const rt = (plain_text: string) => [{ plain_text }];
type Pages = Parameters<typeof parseAffiliates>[0];

describe("resource routing", () => {
  it("pre leads with Early Distress; notice/active lead with Legal", () => {
    expect(resourceTypes({ q1: "pre", q2: "0" })[0]).toBe("Missed Payments / Early Distress");
    expect(resourceTypes({ q1: "active", q2: "0" })[0]).toBe("Legal / Foreclosure");
  });

  it("caps at 4, dedupes shared agencies, and mixes types", () => {
    const picks = pickResources({ q1: "notice", q2: "3+", q5: ["medical", "inherited"] }, defaultReferrals.freeReferrals);
    expect(picks).toHaveLength(4);
    expect(new Set(picks.map((p) => p.name)).size).toBe(4);
    expect(new Set(picks.map((p) => p.type)).size).toBeGreaterThan(1);
  });

  it("always fills to 4 using Income/211 when few types match", () => {
    const picks = pickResources({ q1: "pre", q2: "0" }, defaultReferrals.freeReferrals);
    expect(picks).toHaveLength(4);
    expect(picks.some((p) => /211/.test(p.name))).toBe(true);
  });
});

describe("affiliate routing", () => {
  const a = defaultReferrals.affiliates;
  it("shows Round Sky first when catch-up intent is strong", () => {
    expect(pickAffiliates({ q1: "pre", q4: "keep" }, a).map((x) => x.name)).toEqual(["Round Sky", "The Credit People"]);
  });
  it("shows only The Credit People otherwise", () => {
    expect(pickAffiliates({ q1: "active", q2: "1-2", q4: "sell" }, a).map((x) => x.name)).toEqual(["The Credit People"]);
  });
});

describe("notion parsing", () => {
  it("only approved affiliates are exposed", () => {
    expect(isApprovedStatus("✅ Approved 06/05/2026")).toBe(true);
    expect(isApprovedStatus("Not yet approved")).toBe(false);
    expect(isApprovedStatus("Pending")).toBe(false);
    expect(isApprovedStatus("")).toBe(false);
    const pages = ( [
      { properties: { "Program Name": { type: "title", title: rt("Good") }, Status: { type: "rich_text", rich_text: rt("Approved") }, Category: { type: "select", select: { name: "💵 Personal Loans" } }, "Best For": { type: "rich_text", rich_text: rt("Cash fast") }, "Affiliate Link": { type: "url", url: "https://x.test" } } },
      { properties: { "Program Name": { type: "title", title: rt("Bad") }, Status: { type: "rich_text", rich_text: rt("Applied") }, "Affiliate Link": { type: "url", url: "https://y.test" } } },
    ]) as Pages;
    expect(parseAffiliates(pages)).toEqual([{ name: "Good", category: "Personal Loans", desc: "Cash fast", link: "https://x.test" }]);
  });

  it("prefers client-facing Display Name / Description for Website and hides tags", () => {
    const aff = parseAffiliates([
      { properties: { "Program Name": { type: "title", title: rt("Round Sky [Aggregate]") }, Status: { type: "rich_text", rich_text: rt("Approved") }, "Best For": { type: "rich_text", rich_text: rt("easy sell") }, "Description for Website": { type: "rich_text", rich_text: rt("Fast cash options") }, "Affiliate Link": { type: "url", url: "https://x.test" } } },
      { properties: { "Program Name": { type: "title", title: rt("Tagged [Aggregate]") }, "Display Name": { type: "rich_text", rich_text: rt("Nice Name") }, Status: { type: "rich_text", rich_text: rt("Live") }, "Best For": { type: "rich_text", rich_text: rt("Plain best for") }, "Affiliate Link": { type: "url", url: "https://y.test" } } },
    ]);
    expect(aff.map((a) => [a.name, a.desc])).toEqual([["Round Sky", "Fast cash options"], ["Nice Name", "Plain best for"]]);
  });

  it("free referrals prefer Talking Point and drop rows without a link", () => {
    const pages = ( [
      { properties: { Agency: { type: "title", title: rt("PHFA") }, Type: { type: "select", select: { name: "Legal / Foreclosure" } }, "Talking Point": { type: "rich_text", rich_text: rt("TP") }, Description: { type: "rich_text", rich_text: rt("D") }, "Referral Action / Link": { type: "url", url: "https://phfa.org" } } },
      { properties: { Agency: { type: "title", title: rt("No link") }, "Referral Action / Link": { type: "url", url: null } } },
    ]) as Pages;
    expect(parseFreeReferrals(pages)).toEqual([{ name: "PHFA", type: "Legal / Foreclosure", desc: "TP", link: "https://phfa.org" }]);
  });
});

describe("fetchReferrals", () => {
  afterEach(() => { vi.unstubAllGlobals(); clearReferralCache(); });

  it("authenticates, paginates, and normalizes both databases", async () => {
    const calls: { url: string; body: { start_cursor?: string }; auth: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      calls.push({ url, body, auth: (init.headers as Record<string, string>).Authorization });
      const free = url.includes("free-db");
      const page = free
        ? { properties: { Agency: { type: "title", title: rt(body.start_cursor ? "B" : "A") }, Type: { type: "select", select: { name: "Legal / Foreclosure" } }, "Referral Action / Link": { type: "url", url: "https://a.test" } } }
        : { properties: { "Program Name": { type: "title", title: rt("P") }, Status: { type: "rich_text", rich_text: rt("Approved") }, "Affiliate Link": { type: "url", url: "https://p.test" } } };
      const more = free && !body.start_cursor;
      return new Response(JSON.stringify({ results: [page], has_more: more, next_cursor: more ? "c1" : null }));
    });
    const out = await fetchReferrals({ NOTION_TOKEN: "secret_x", NOTION_FREE_DB_ID: "free-db", NOTION_AFFILIATE_DB_ID: "aff-db" });
    expect(out.source).toBe("notion");
    expect(out.freeReferrals.map((r) => r.name)).toEqual(["A", "B"]);
    expect(out.affiliates.map((r) => r.name)).toEqual(["P"]);
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.auth === "Bearer secret_x")).toBe(true);
  });

  it("throws without a token so the API answers 502 and the client falls back", async () => {
    await expect(fetchReferrals({})).rejects.toThrow(/NOTION_TOKEN/);
  });
});

describe("results storage", () => {
  const env = { UPSTASH_REDIS_REST_URL: "https://redis.test", UPSTASH_REDIS_REST_TOKEN: "t" };
  const good = { q1: "pre", q2: "1-2", q3: "no", q4: "keep", q5: ["job", "illness"] };

  it("only accepts the quiz's own answer shape", () => {
    expect(sanitizeAnswers(good)).toEqual(good);
    expect(sanitizeAnswers({ ...good, extra: "x" })).toBeNull();
    expect(sanitizeAnswers({ q1: "pre" })).toBeNull();
    expect(sanitizeAnswers({ ...good, q2: ["not", "a", "string"] })).toBeNull();
    expect(sanitizeAnswers({ ...good, q1: "x".repeat(500) })).toBeNull();
    expect(sanitizeAnswers("nope")).toBeNull();
  });

  it("saves under a fresh 8-hex id with SET NX, retrying on a collision", async () => {
    const calls: string[][] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      const cmd = JSON.parse(init.body as string) as string[];
      calls.push(cmd);
      return new Response(JSON.stringify({ result: calls.length === 1 ? null : "OK" }));
    }));
    const id = await saveResult(env, good);
    expect(id).toMatch(RESULT_ID_RE);
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe("SET");
    expect(calls[0][3]).toBe("NX");
    expect(calls[0][1]).not.toBe(calls[1][1]);
    vi.unstubAllGlobals();
  });

  it("loads a stored result, and returns null for unknown or malformed ids", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      const [, k] = JSON.parse(init.body as string) as string[];
      return new Response(JSON.stringify({ result: k === "result:a1b2c3d4" ? JSON.stringify({ answers: good, createdAt: "now" }) : null }));
    }));
    expect((await loadResult(env, "a1b2c3d4"))?.answers).toEqual(good);
    expect(await loadResult(env, "ffffffff")).toBeNull();
    expect(await loadResult(env, "../etc/passwd")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("throws when storage is not configured", async () => {
    await expect(saveResult({}, good)).rejects.toThrow(/not configured/);
  });
});
