import { ForeclosureQuizApp } from "@/components/ForeclosureQuizApp";

const Index = () => {
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
        <ForeclosureQuizApp />
      </main>

      <footer className="border-t bg-muted/10 py-8 text-xs text-muted-foreground mt-auto z-10 relative">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-3">
          <div className="font-semibold text-sm text-foreground/80">About</div>
          <p className="leading-relaxed">
            Way Out Now provides real estate guidance, property evaluation, and connection to professional resources to help property owners explore available options. We may connect you with licensed agents, investors, contractors, or other professionals.
          </p>
          <p>
            &copy; 2026 Way Out Now Solutions - Wisps of Night Properties LLC
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
