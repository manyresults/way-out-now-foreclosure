import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizPage } from "@/components/QuizPage";
import { loadResult, resultsEnv, RESULT_ID_RE, type StoredResult } from "@/server/results";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Foreclosure Exit Plan | Way Out Now",
  robots: { index: false, follow: false },
};

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!RESULT_ID_RE.test(id)) notFound();
  let stored: StoredResult | null = null;
  try {
    stored = await loadResult(resultsEnv(), id);
  } catch (err) {
    console.error("[results]", err instanceof Error ? err.message : err);
  }
  if (!stored) notFound();
  return <QuizPage initialAnswers={stored.answers} />;
}
