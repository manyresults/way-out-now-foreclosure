import { QuizPage } from "@/components/QuizPage";

// The results link carries the answers in ?data=..., so this page is rendered per request.
export default async function ThankYou({ searchParams }: { searchParams: Promise<{ data?: string | string[] }> }) {
  const { data } = await searchParams;
  return <QuizPage initialData={Array.isArray(data) ? data[0] : data} />;
}
