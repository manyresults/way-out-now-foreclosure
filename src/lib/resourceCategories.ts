import {
  Banknote, BadgeCheck, BellRing, CalendarClock, Compass, FileText, HandCoins, HeartHandshake,
  Home, Landmark, LifeBuoy, Scale, ShieldCheck, Siren, TrendingUp, Wallet, type LucideIcon,
} from "lucide-react";
import type { Answers } from "./routing";

export type CategoryInfo = { label: string; blurb: string; icon: LucideIcon };

/** Friendly, homeowner-facing names for the Notion "Type" values. */
const CATEGORIES: Record<string, CategoryInfo> = {
  "Missed Payments / Early Distress": { label: "Get Caught Up", blurb: "Programs that can help with missed payments before things escalate.", icon: CalendarClock },
  "Legal / Foreclosure": { label: "Know Your Rights", blurb: "Free legal help and guidance on the foreclosure process.", icon: Scale },
  "Income Loss / Hardship": { label: "Emergency Financial Help", blurb: "Grants and local aid for urgent bills and housing costs.", icon: HandCoins },
  "Bankruptcy / Debt": { label: "Debt & Bankruptcy Guidance", blurb: "Nonprofit counselors and plain-language guides.", icon: FileText },
  "Inherited / Vacant Property": { label: "Inherited or Vacant Homes", blurb: "Help with estates, transfers and property issues.", icon: Home },
  "Emotional / Family Stress": { label: "Family & Emotional Support", blurb: "Support for the stress that comes with all of this.", icon: HeartHandshake },
  "Special Loans (FHA / USDA)": { label: "Special Loan Programs", blurb: "Options for FHA and USDA loans.", icon: Landmark },
  "Internal Resource": { label: "From Way Out Now", blurb: "Our own guides and tools.", icon: Compass },
};

/** New Notion options that aren't listed above still render, under a neutral heading. */
const FALLBACK: CategoryInfo = { label: "More Free Resources", blurb: "Additional help worth a look.", icon: LifeBuoy };

export const categoryFor = (type: string): CategoryInfo => CATEGORIES[type] ?? FALLBACK;

/** Groups resources by Notion type, keeping the order the routing put them in. */
export function groupByCategory<T extends { type: string }>(items: T[]): { type: string; info: CategoryInfo; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.type, [...(groups.get(item.type) ?? []), item]);
  return [...groups].map(([type, list]) => ({ type, info: categoryFor(type), items: list }));
}

/** Icon for a partner program, by its Notion Category. */
export function partnerIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/personal loans|refinance|loan modification/.test(c)) return Banknote;
  if (/legal/.test(c)) return Scale;
  if (/credit repair/.test(c)) return TrendingUp;
  if (/debt relief|financial education/.test(c)) return Wallet;
  return BadgeCheck;
}

/** Icon for the top of the page, by where the homeowner is in the process. */
export function situationIcon(answers: Answers): LucideIcon {
  if (answers.q1 === "active") return Siren;
  if (answers.q1 === "notice") return BellRing;
  return ShieldCheck;
}
