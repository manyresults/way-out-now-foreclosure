// Shared by the browser bundle and the server-side Notion proxy.

export type FreeReferralType =
  | "Missed Payments / Early Distress"
  | "Legal / Foreclosure"
  | "Income Loss / Hardship"
  | "Bankruptcy / Debt"
  | "Inherited / Vacant Property"
  | "Emotional / Family Stress"
  | "Special Loans (FHA / USDA)"
  | "Internal Resource";

/** A row of the Notion "Free Referral Options" database. */
export type FreeReferral = {
  name: string;
  /** Notion select value; kept as string so new options in Notion don't break the app. */
  type: string;
  /** Short blurb shown on the results card (Talking Point, falling back to Description). */
  desc: string;
  link: string;
};

/** A row of the Notion "Approved Affiliate Programs" database. */
export type AffiliateProgram = {
  name: string;
  /** Notion select value, emoji stripped, e.g. "Personal Loans". */
  category: string;
  desc: string;
  link: string;
};

export type ReferralCatalog = {
  freeReferrals: FreeReferral[];
  affiliates: AffiliateProgram[];
};

export type ReferralResponse = ReferralCatalog & {
  source: "notion" | "fallback";
  fetchedAt: string;
};
