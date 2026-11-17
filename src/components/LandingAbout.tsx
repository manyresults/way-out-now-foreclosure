import Image from "next/image";
import { ArrowRight, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const mission = [
  { icon: ShieldCheck, text: "Provide homeowners with honest, transparent options when facing financial or personal hardship." },
  { icon: Lightbulb, text: "Bridge the gap between traditional real estate and compassionate, creative solutions." },
  { icon: HeartHandshake, text: "Build lasting trust through empathy, education, and integrity." },
];

/** "About us" + "Our mission" for the landing page. The button starts the quiz. */
export function LandingAbout({ onStart }: { onStart: () => void }) {
  return (
    <section aria-labelledby="about-heading" className="space-y-14">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="space-y-5 text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">About us</p>
          <h2 id="about-heading" className="text-3xl font-bold leading-tight md:text-4xl">
            Real Estate Guidance Rooted in Compassion and Clarity
          </h2>
          <p className="text-lg text-muted-foreground">
            At Way Out Now, we help homeowners in tough situations find clear, pressure-free solutions.
          </p>
          <p className="text-lg text-muted-foreground">
            Whether you’re behind on payments, facing foreclosure, or dealing with inherited property, our team works to create a personalized plan that fits your needs and restores your peace of mind.
          </p>
        </div>
        <Image
          src="/images/couple-talking-options.jpg"
          alt="A couple leaning on each other while they talk through their options"
          width={768}
          height={513}
          sizes="(min-width: 768px) 480px, 100vw"
          className="w-full rounded-2xl object-cover shadow-xl"
        />
      </div>

      <div className="space-y-8">
        <h3 className="text-center text-2xl font-bold md:text-3xl">Our mission</h3>
        <ul className="grid gap-6 md:grid-cols-3">
          {mission.map(({ icon: Icon, text }) => (
            <li key={text} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-lg leading-snug">{text}</p>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Button size="lg" onClick={onStart} className="group h-auto rounded-full px-8 py-6 text-lg font-semibold">
            Start Your Assessment
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
