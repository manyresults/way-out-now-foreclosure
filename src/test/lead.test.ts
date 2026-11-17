import { describe, it, expect, vi, afterEach } from "vitest";
import { buildLeadPayload, sanitizeAttribution, sanitizeContact, sendToGhl, toE164 } from "../server/lead";

afterEach(() => vi.unstubAllGlobals());

const contact = { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "(215) 555-0100" };
const answers = { q1: "pre", q2: "1-2", q3: "no", q4: "keep", q5: ["income", "divorce"] };

describe("lead contact + attribution", () => {
  it("accepts a valid contact and normalises email case and whitespace", () => {
    expect(sanitizeContact({ ...contact, email: "  Jane@Example.com " })?.email).toBe("jane@example.com");
  });
  it("rejects missing names, bad emails and short phone numbers", () => {
    expect(sanitizeContact({ ...contact, firstName: "" })).toBeNull();
    expect(sanitizeContact({ ...contact, email: "nope" })).toBeNull();
    expect(sanitizeContact({ ...contact, phone: "12345" })).toBeNull();
    expect(sanitizeContact(null)).toBeNull();
  });
  it("formats US numbers as E.164 and leaves others alone", () => {
    expect(toE164("(215) 555-0100")).toBe("+12155550100");
    expect(toE164("1-215-555-0100")).toBe("+12155550100");
    expect(toE164("+44 20 7946 0958")).toBe("+44 20 7946 0958");
  });
  it("keeps only known attribution keys", () => {
    expect(sanitizeAttribution({ utm_source: "facebook", gclid: "abc", evil: "x", landing_url: 5 })).toEqual({ utm_source: "facebook", gclid: "abc" });
  });
});

describe("buildLeadPayload", () => {
  const payload = buildLeadPayload({
    contact,
    answers,
    attribution: { utm_source: "facebook" },
    resultsUrl: "https://plan.example.com/results/a1b2c3d4",
    resultsId: "a1b2c3d4",
    header: { badge: "PRE-FORECLOSURE", title: "You caught this early" },
    resources: [{ name: "PHFA", type: "Missed Payments / Early Distress", desc: "d", link: "https://phfa.org" }],
    affiliates: [{ name: "Round Sky", category: "Personal Loans", desc: "d", link: "https://roundsky.com" }],
    now: new Date("2026-11-20T12:00:00Z"),
  });

  it("is flat, with GHL's standard contact fields at the top level", () => {
    expect(payload).toMatchObject({
      event: "foreclosure_quiz_completed",
      submitted_at: "2026-11-20T12:00:00.000Z",
      first_name: "Jane",
      last_name: "Doe",
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "+12155550100",
      phone_raw: "(215) 555-0100",
      utm_source: "facebook",
      results_url: "https://plan.example.com/results/a1b2c3d4",
      results_id: "a1b2c3d4",
    });
  });
  it("includes both answer codes and readable labels", () => {
    expect(payload.foreclosure_status).toBe("pre");
    expect(payload.foreclosure_status_label).not.toBe("pre");
    expect(payload.hardships).toEqual(["income", "divorce"]);
    expect(payload.hardships_labels.split(", ")).toHaveLength(2);
  });
  it("lists resources and partners as data and as ready-to-paste text", () => {
    expect(payload.resources[0]).toEqual({ name: "PHFA", category: "Missed Payments / Early Distress", link: "https://phfa.org" });
    expect(payload.resources_text).toBe("- PHFA: https://phfa.org");
    expect(payload.partners_text).toBe("- Round Sky: https://roundsky.com");
  });
});

describe("sendToGhl", () => {
  const fast = { backoffMs: 1, timeoutMs: 1000 };
  const payload = { event: "x" } as never;

  it("posts JSON to the webhook URL", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendToGhl("https://hooks.test/abc", payload, fast);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://hooks.test/abc");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ event: "x" });
  });
  it("retries 5xx and network errors, then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockRejectedValueOnce(new Error("socket hang up"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendToGhl("https://hooks.test/abc", payload, fast);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("gives up after the last attempt", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendToGhl("https://hooks.test/abc", payload, fast)).rejects.toThrow(/500/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("does not retry a 4xx, which means the URL or setup is wrong", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendToGhl("https://hooks.test/abc", payload, fast)).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
