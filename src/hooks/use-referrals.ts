import { useQuery } from "@tanstack/react-query";
import { defaultReferrals } from "@/data/defaultReferrals";
import type { ReferralCatalog, ReferralResponse } from "@/lib/referralTypes";

const REFERRALS_URL = import.meta.env.VITE_REFERRALS_URL || "/api/referrals";

async function loadReferrals(): Promise<ReferralResponse> {
  const res = await fetch(REFERRALS_URL);
  if (!res.ok) throw new Error(`referrals ${res.status}`);
  const data = (await res.json()) as ReferralResponse;
  // An empty Notion table must not blank the results page.
  if (!data.freeReferrals?.length) throw new Error("no free referrals returned");
  return data;
}

/** Live referral catalog from Notion, with the bundled snapshot as the fallback. */
export function useReferrals(): ReferralCatalog & { source: "notion" | "fallback"; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: loadReferrals,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  if (!data) return { ...defaultReferrals, source: "fallback", isLoading };
  return {
    freeReferrals: data.freeReferrals,
    // If every affiliate row is unapproved, show none rather than silently reverting to the snapshot.
    affiliates: data.affiliates,
    source: data.source,
    isLoading: false,
  };
}
