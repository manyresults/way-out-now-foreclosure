import { ForeclosureQuizApp } from "@/components/ForeclosureQuizApp";
import { SiteFooter } from "@/components/SiteFooter";
import type { Answers } from "@/lib/routing";

export const QuizPage = ({ initialData, initialAnswers }: { initialData?: string; initialAnswers?: Answers }) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background visual elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-secondary/30 to-background -z-10" />
      
      <header className="py-6 px-4 flex justify-center bg-background shadow-sm border-b">
        <div className="text-center">
          <img 
            src="https://wayoutnow.com/wp-content/uploads/2025/10/Way-out-Now-Title-Logo.png" 
            alt="Way Out Now" 
            className="h-12 md:h-16 object-contain"
          />
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24 pt-8 flex-grow">
        <ForeclosureQuizApp initialData={initialData} initialAnswers={initialAnswers} />
      </main>

      <SiteFooter />
    </div>
  );
};
