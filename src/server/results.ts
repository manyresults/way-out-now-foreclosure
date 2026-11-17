import { randomBytes } from "node:crypto";
import type { Answers } from "@/lib/routing";

/** Credentials for a Redis REST store (Upstash, installed from the Vercel Marketplace). */
export type ResultsEnv = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
};

export type StoredResult = { answers: Answers; createdAt: string };

/** 8 hex characters, e.g. "a1b2c3d4". */
export const RESULT_ID_RE = /^[0-9a-f]{8}$/;

const MAX_VALUE_LEN = 120;
const MAX_MULTI = 12;
const KEYS = ["q1", "q2", "q3", "q4", "q5"];

const str = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= MAX_VALUE_LEN;

/** Accepts only the quiz's own shape (q1-q5 strings / a list of strings); anything else is rejected. */
export function sanitizeAnswers(input: unknown): Answers | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const out: Answers = {};
  for (const key of Object.keys(raw)) {
    if (!KEYS.includes(key)) return null;
    const v = raw[key];
    if (str(v)) out[key] = v;
    else if (Array.isArray(v) && v.length <= MAX_MULTI && v.every(str)) out[key] = v as string[];
    else return null;
  }
  // The results page cannot be built without the first four answers.
  if (!["q1", "q2", "q3", "q4"].every((k) => typeof out[k] === "string")) return null;
  return out;
}

function config(env: ResultsEnv) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("results storage is not configured");
  return { url: url.replace(/\/$/, ""), token };
}

async function command(env: ResultsEnv, args: string[]): Promise<unknown> {
  const { url, token } = config(env);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`results storage ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`results storage: ${json.error}`);
  return json.result ?? null;
}

const key = (id: string) => `result:${id}`;

/** Stores the answers under a new random id (no expiry, so the link is evergreen) and returns the id. */
export async function saveResult(env: ResultsEnv, answers: Answers): Promise<string> {
  const value = JSON.stringify({ answers, createdAt: new Date().toISOString() } satisfies StoredResult);
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomBytes(4).toString("hex");
    // NX: never overwrite an existing result if an id ever collides.
    if ((await command(env, ["SET", key(id), value, "NX"])) === "OK") return id;
  }
  throw new Error("could not allocate a result id");
}

export async function loadResult(env: ResultsEnv, id: string): Promise<StoredResult | null> {
  if (!RESULT_ID_RE.test(id)) return null;
  const raw = await command(env, ["GET", key(id)]);
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as StoredResult;
    return sanitizeAnswers(parsed.answers) ? parsed : null;
  } catch {
    return null;
  }
}

/** Picks just the storage variables out of process.env. */
export const resultsEnv = (): ResultsEnv => ({
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
});
