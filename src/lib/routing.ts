import type { AffiliateProgram, FreeReferral, ReferralCatalog } from "./referralTypes";

export type Answers = Record<string, string | string[]>;

export const MAX_RESOURCES = 4;
export const MAX_AFFILIATES = 2;

const T = {
  early: "Missed Payments / Early Distress",
  legal: "Legal / Foreclosure",
  income: "Income Loss / Hardship",
  family: "Emotional / Family Stress",
  inherited: "Inherited / Vacant Property",
  debt: "Bankruptcy / Debt",
} as const;

export function resultHeader(answers: Answers) {
  const q1 = answers.q1 as string;
  const q3 = answers.q3 as string;
  if (q1 === "pre") {
    return {
      badge: "PRE-FORECLOSURE · TIME IS ON YOUR SIDE",
      title: "You caught this early — that matters most.",
      desc: "Most options, least pressure. Lock in free guidance before anything becomes official.",
    };
  }
  if (q1 === "notice") {
    return {
      badge: "NOTICE RECEIVED · ACT THIS MONTH",
      title: "A notice doesn't mean it's over — but the clock is running.",
      desc: "Real time in PA before a sale, but every week matters. Understand what the notice means first.",
    };
  }
  if (q1 === "active") {
    return {
      badge: "IN FORECLOSURE · PRIORITY RESPONSE",
      title: q3 === "yes" ? "With a sale date set, speed is what protects your options." : "You're in it — let's find out what's still possible.",
      desc: "More paths than most realize, including some that don't require selling. Move now.",
    };
  }
  return { badge: "", title: "", desc: "" };
}

export function ctaCopy(answers: Answers) {
  if (answers.q4 === "keep") {
    return "We'll map every way to keep the house — loan modification, repayment plans, and emergency funding — alongside the free resources below.";
  }
  if (answers.q4 === "sell") {
    return "We'll walk through a straightforward cash offer, listing to maximize value, or a leaseback that lets you stay as a tenant.";
  }
  return "30–45 minutes, no obligation. We'll walk through every path still open to you — including ones most people don't know exist.";
}

/** Which Notion "Type" values fire for these answers, in display-priority order. */
export function resourceTypes(answers: Answers): string[] {
  const q1 = answers.q1 as string;
  const q2 = answers.q2 as string;
  const q5 = (answers.q5 as string[]) || [];

  const types: string[] = [];
  const early = q1 === "pre";
  const legal = q1 === "notice" || q1 === "active";
  // pre leads with Early Distress; notice/active lead with Legal.
  if (early) types.push(T.early);
  if (legal) types.push(T.legal);
  if (q2 === "3+" || q5.includes("income") || q5.includes("medical")) types.push(T.income);
  if (q5.includes("divorce") || q5.includes("death") || q5.includes("medical")) types.push(T.family);
  if (q5.includes("inherited")) types.push(T.inherited);
  if (q5.includes("other") && q2 === "3+") types.push(T.debt);
  return types;
}

export function pickResources(answers: Answers, freeReferrals: FreeReferral[]): FreeReferral[] {
  const byType = (type: string) => freeReferrals.filter((r) => r.type === type);
  const seen = new Set<string>();
  const picked: FreeReferral[] = [];
  const add = (r?: FreeReferral) => {
    if (!r || picked.length >= MAX_RESOURCES) return;
    // Same agency can appear under several types (e.g. 211); dedupe by name and by link.
    const key = r.link.replace(/\/+$/, "").toLowerCase();
    if (seen.has(r.name) || seen.has(key)) return;
    seen.add(r.name);
    seen.add(key);
    picked.push(r);
  };

  // Round-robin across the matched types so a mixed situation sees every kind of help,
  // not just the first category's three agencies.
  const lists = resourceTypes(answers).map(byType);
  for (let i = 0; picked.length < MAX_RESOURCES && lists.some((l) => i < l.length); i++) {
    lists.forEach((l) => add(l[i]));
  }

  // Fill: Income Loss / Hardship, 211 first.
  const fill = byType(T.income).sort((a, b) => Number(/211/.test(b.name)) - Number(/211/.test(a.name)));
  fill.forEach(add);
  return picked;
}

type Intent = "catchup" | "legal" | "always" | "none";

/** Categories come from the Notion Category select (emoji stripped). */
function affiliateIntent(a: AffiliateProgram): Intent {
  const c = a.category.toLowerCase();
  if (/personal loans|refinance|loan modification/.test(c)) return "catchup";
  if (/legal/.test(c)) return "legal";
  if (/credit repair|debt relief|financial education/.test(c)) return "always";
  return "none"; // e.g. Insurance & Home Services: not routed until a rule is added
}

export function pickAffiliates(answers: Answers, affiliates: AffiliateProgram[]): AffiliateProgram[] {
  const catchUpIntent = answers.q4 === "keep" || answers.q2 === "3+" || answers.q1 === "pre";
  const legalIntent = answers.q1 === "notice" || answers.q1 === "active";

  const eligible = affiliates.filter((a) => {
    const intent = affiliateIntent(a);
    return intent === "always" || (intent === "catchup" && catchUpIntent) || (intent === "legal" && legalIntent);
  });
  // Catch-up offers lead when intent is strong.
  const rank = (a: AffiliateProgram) => (affiliateIntent(a) === "always" ? 1 : 0);
  return [...eligible].sort((a, b) => rank(a) - rank(b)).slice(0, MAX_AFFILIATES);
}

export function generateResults(answers: Answers, catalog: ReferralCatalog) {
  return {
    header: resultHeader(answers),
    resources: pickResources(answers, catalog.freeReferrals),
    affiliates: pickAffiliates(answers, catalog.affiliates),
    ctaCopy: ctaCopy(answers),
  };
}
