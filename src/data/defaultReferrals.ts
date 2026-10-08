import type { ReferralCatalog } from "@/lib/referralTypes";

// Snapshot of the Notion "Referral Databases" used when /api/referrals is unreachable
// (offline, token not configured, Notion outage). Notion is the source of truth.
export const defaultReferrals: ReferralCatalog = {
  freeReferrals: [
    { type: "Missed Payments / Early Distress", name: "Pennsylvania Housing Finance Agency (PHFA)", desc: "PHFA can review options like refinancing or forbearance before foreclosure starts.", link: "https://www.phfa.org/" },
    { type: "Missed Payments / Early Distress", name: "HUD-Approved Housing Counselors", desc: "A HUD counselor can help you call your lender and explore modification programs.", link: "https://www.hud.gov/program_offices/housing/sfh/hcc" },
    { type: "Missed Payments / Early Distress", name: "NeighborWorks / Clarifi (PA/NJ)", desc: "Clarifi helps families stabilize budgets and manage mortgage relief programs.", link: "https://clarifi.org" },
    { type: "Legal / Foreclosure", name: "Pennsylvania Legal Aid Network (PLAN)", desc: "PLAN can review your paperwork and explain your legal rights at no cost.", link: "https://palegalaid.net/find-legal-help" },
    { type: "Legal / Foreclosure", name: "Legal Aid of Southeastern PA (LASP)", desc: "LASP offers free legal advice and may even represent you in court if needed.", link: "https://lasp.org" },
    { type: "Legal / Foreclosure", name: "Neighborhood Legal Services (Western PA)", desc: "NLS can walk you through your rights and help you respond to foreclosure notices.", link: "https://nlsa.us/" },
    { type: "Income Loss / Hardship", name: "HEMAP (Homeowners Emergency Mortgage Assistance)", desc: "HEMAP can step in to help pay arrears directly to your lender — apply through a counselor.", link: "https://phfa.org/counseling/hemap.aspx" },
    { type: "Income Loss / Hardship", name: "PA Homeowner Assistance Fund (PAHAF)", desc: "PAHAF can provide a one-time grant to help you stabilize housing costs.", link: "https://pahaf.org/" },
    { type: "Income Loss / Hardship", name: "Catholic Social Services / United Way 211", desc: "If you need quick relief for essential bills, start with 211 for local funding sources.", link: "https://uwp.org/211" },
    { type: "Emotional / Family Stress", name: "United Way 211 (Family Support)", desc: "If you're managing more than just finances, 211 can link you to emotional or family help.", link: "https://uwp.org/211" },
    { type: "Emotional / Family Stress", name: "County Family Services", desc: "Family Services can connect you with counselors and resources for stability.", link: "https://buckscounty.gov/" },
    { type: "Inherited / Vacant Property", name: "County Register of Wills / Estate Services", desc: "They can guide you through transferring or selling an inherited home legally.", link: "https://buckscounty.gov/166/Register-of-Wills" },
    { type: "Inherited / Vacant Property", name: "Local Code Enforcement / Land Bank", desc: "The land bank can help if you're facing blight violations or want to sell as-is.", link: "https://buckscounty.gov/272/Planning-Commission" },
    { type: "Bankruptcy / Debt", name: "Consumer Credit Counseling Service (CCCS)", desc: "Nonprofit counselors can review your debts and explain bankruptcy and repayment options.", link: "https://www.cccspa.org/" },
    { type: "Bankruptcy / Debt", name: "PA Law Help — Bankruptcy Guide", desc: "A plain-language guide to how bankruptcy can affect a foreclosure.", link: "https://www.palawhelp.org/resource/a-guide-to-bankruptcy" },
  ],
  affiliates: [
    {
      name: "Round Sky",
      category: "Personal Loans",
      desc: "If you need funds fast to catch up, this free 2-minute check shows what you might qualify for — even with less-than-perfect credit.",
      link: "https://roundsky.com",
    },
    {
      name: "The Credit People",
      category: "Credit Repair & Debt Relief",
      desc: "A lot of homeowners in your situation don't realize their credit has already taken a hit. This team specializes in helping people rebuild fast — no pressure, but it could save you thousands.",
      link: "https://thecreditpeople.net/?a=17584&c=1&s1=",
    },
  ],
};
