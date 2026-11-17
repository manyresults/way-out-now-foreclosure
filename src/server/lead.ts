import { questions } from "@/lib/quizQuestions";
import type { Answers } from "@/lib/routing";
import type { AffiliateProgram, FreeReferral } from "@/lib/referralTypes";

export type Contact = { firstName: string; lastName: string; email: string; phone: string };
export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

const ATTRIBUTION_KEYS = ["landing_url", "referrer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validates the contact block from the quiz form. Returns null when anything required is missing or malformed. */
export function sanitizeContact(input: unknown): Contact | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const contact = {
    firstName: clean(raw.firstName, 80),
    lastName: clean(raw.lastName, 80),
    email: clean(raw.email, 200).toLowerCase(),
    phone: clean(raw.phone, 40),
  };
  if (!contact.firstName || !contact.lastName || !EMAIL_RE.test(contact.email)) return null;
  if (contact.phone.replace(/\D/g, "").length < 10) return null;
  return contact;
}

/** Keeps only the known marketing fields, trimmed and length-capped. */
export function sanitizeAttribution(input: unknown): Attribution {
  const out: Attribution = {};
  if (!input || typeof input !== "object") return out;
  const raw = input as Record<string, unknown>;
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(raw[key], key === "landing_url" || key === "referrer" ? 500 : 200);
    if (v) out[key] = v;
  }
  return out;
}

/** US numbers as +1XXXXXXXXXX (what GHL expects); anything else is passed through unchanged. */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone;
}

const label = (qId: string, value: string) => questions.find((q) => q.id === qId)?.options.find((o) => o.value === value)?.label ?? value;

type Link = { name: string; category: string; link: string };
const lines = (items: Link[]) => items.map((i) => `- ${i.name}: ${i.link}`).join("\n");

export type LeadPayload = ReturnType<typeof buildLeadPayload>;

/**
 * Flat JSON on purpose: GHL's "Create/Update Contact" action maps top-level keys most easily.
 * Standard fields (first_name, last_name, email, phone) use GHL's own names.
 */
export function buildLeadPayload(args: {
  contact: Contact;
  answers: Answers;
  attribution: Attribution;
  resultsUrl: string;
  resultsId: string | null;
  header: { badge: string; title: string };
  resources: FreeReferral[];
  affiliates: AffiliateProgram[];
  now?: Date;
}) {
  const { contact, answers, attribution, resultsUrl, resultsId, header, resources, affiliates } = args;
  const hardships = Array.isArray(answers.q5) ? answers.q5 : answers.q5 ? [answers.q5] : [];
  const resourceList: Link[] = resources.map((r) => ({ name: r.name, category: r.type, link: r.link }));
  const partnerList: Link[] = affiliates.map((a) => ({ name: a.name, category: a.category, link: a.link }));
  const q = (id: string) => (answers[id] as string) ?? "";

  return {
    event: "foreclosure_quiz_completed",
    schema_version: 1,
    submitted_at: (args.now ?? new Date()).toISOString(),

    first_name: contact.firstName,
    last_name: contact.lastName,
    full_name: `${contact.firstName} ${contact.lastName}`.trim(),
    email: contact.email,
    phone: toE164(contact.phone),
    phone_raw: contact.phone,

    foreclosure_status: q("q1"),
    foreclosure_status_label: label("q1", q("q1")),
    payments_behind: q("q2"),
    payments_behind_label: label("q2", q("q2")),
    sale_date_set: q("q3"),
    sale_date_set_label: label("q3", q("q3")),
    goal: q("q4"),
    goal_label: label("q4", q("q4")),
    hardships,
    hardships_labels: hardships.map((h) => label("q5", h)).join(", "),

    results_url: resultsUrl,
    results_id: resultsId ?? "",
    results_badge: header.badge,
    results_headline: header.title,
    resources: resourceList,
    partners: partnerList,
    resources_text: lines(resourceList),
    partners_text: lines(partnerList),

    ...attribution,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POSTs the payload to the GHL inbound-webhook URL. Retries network errors, timeouts, 429 and 5xx a couple of
 * times; any other 4xx is a configuration problem, so it fails immediately.
 */
export async function sendToGhl(webhookUrl: string, payload: LeadPayload, opts: { attempts?: number; timeoutMs?: number; backoffMs?: number } = {}): Promise<void> {
  const { attempts = 3, timeoutMs = 6000, backoffMs = 400 } = opts;
  let lastError = "unknown";
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (res.ok) return;
      lastError = `GHL responded ${res.status}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      lastError = controller.signal.aborted ? `timed out after ${timeoutMs}ms` : err instanceof Error ? err.message : "network error";
    } finally {
      clearTimeout(timer);
    }
    if (i < attempts - 1) await sleep(backoffMs * (i + 1));
  }
  throw new Error(lastError);
}
