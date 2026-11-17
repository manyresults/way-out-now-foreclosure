import { BadgeCheck, Calendar, CalendarCheck, Check, Clock, ExternalLink, LifeBuoy, ListChecks, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { groupByCategory, partnerIcon, situationIcon } from "@/lib/resourceCategories";
import type { generateResults } from "@/lib/routing";
import type { Answers } from "@/lib/routing";

type Results = ReturnType<typeof generateResults>;

const IconBadge = ({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) => (
  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ${className}`}>
    <Icon className="h-6 w-6" aria-hidden="true" />
  </span>
);

export function ResultsView({ answers, results, bookingUrl, showSaveLink }: { answers: Answers; results: Results; bookingUrl: string; showSaveLink: boolean }) {
  const SituationIcon = situationIcon(answers);
  const groups = groupByCategory(results.resources);
  const steps: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: LifeBuoy, title: "Reach out to free help", desc: "Agencies and programs matched to your situation." },
    ...(results.affiliates.length > 0 ? [{ icon: ListChecks, title: "Compare partner options", desc: "See what you may qualify for." }] : []),
    { icon: CalendarCheck, title: "Talk with us", desc: "A free strategy session to map every option." },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <SituationIcon className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-full tracking-wider mb-6">
          {results.header.badge}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">{results.header.title}</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{results.header.desc}</p>
      </div>

      {/* Your plan at a glance */}
      <ol className="mb-12 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]" aria-label="Your plan at a glance">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
            <IconBadge icon={s.icon} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
              <p className="font-semibold leading-tight">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {showSaveLink && (
        <div className="max-w-2xl mx-auto mb-12 rounded-xl border bg-muted/30 p-4 text-center text-sm">
          <p className="text-muted-foreground mb-2">
            This is your personal results page. Bookmark it or save the link. It will always be here when you need it.
          </p>
          <button
            type="button"
            className="font-semibold text-primary underline underline-offset-4"
            onClick={(e) => {
              const button = e.currentTarget;
              navigator.clipboard?.writeText(window.location.href).then(() => {
                button.textContent = "Link copied";
              });
            }}
          >
            Copy my link
          </button>
        </div>
      )}

      {/* Free resources, grouped by category */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-secondary rounded-lg">
            <LifeBuoy className="w-6 h-6 text-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-bold">Recommended Free Resources</h3>
        </div>
        <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 md:items-start">
          {groups.map(({ type, info, items }) => (
            <section key={type} aria-labelledby={`cat-${type}`} className={groups.length === 1 ? "md:col-span-2" : undefined}>
              <div className="mb-4 flex items-center gap-3">
                <IconBadge icon={info.icon} />
                <div>
                  <h4 id={`cat-${type}`} className="text-lg font-bold leading-tight">{info.label}</h4>
                  <p className="text-sm text-muted-foreground">{info.blurb}</p>
                </div>
              </div>
              <div className={groups.length === 1 ? "grid gap-6 md:grid-cols-2" : "grid gap-6"}>
                {items.map((res) => (
                  <Card key={res.link} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-xl">{res.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground">{res.desc}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={res.link} target="_blank" rel="noopener noreferrer">
                          Visit Website <ExternalLink className="ml-2 w-4 h-4" aria-hidden="true" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Partner programs */}
      {results.affiliates.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Check className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold">Approved Partner Programs</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {results.affiliates.map((aff) => {
              const Icon = partnerIcon(aff.category);
              return (
                <Card key={aff.link} className="border-primary/20 bg-primary/5 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <IconBadge icon={Icon} className="bg-background" />
                      <div>
                        {aff.category && <p className="text-xs font-bold uppercase tracking-wider text-primary">{aff.category}</p>}
                        <CardTitle className="text-xl">{aff.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-foreground/80">{aff.desc}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href={aff.link} target="_blank" rel="noopener noreferrer">
                        Check Eligibility <ExternalLink className="ml-2 w-4 h-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-3xl shadow-lg mb-8 text-center">
        <h3 className="text-3xl font-bold mb-4">Book Your Free Strategy Session</h3>
        <p className="text-lg opacity-90 max-w-2xl mx-auto mb-6">{results.ctaCopy}</p>
        <ul className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
          {[
            [Clock, "30 to 45 minutes"],
            [ShieldCheck, "No obligation"],
            [BadgeCheck, "Free to book"],
          ].map(([Icon, text]) => {
            const I = Icon as LucideIcon;
            return (
              <li key={text as string} className="flex items-center gap-2">
                <I className="h-4 w-4" aria-hidden="true" />
                {text as string}
              </li>
            );
          })}
        </ul>
        <Button size="lg" variant="secondary" className="px-8 py-6 h-auto text-lg font-bold rounded-full w-full md:w-auto" asChild>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-2 w-5 h-5" aria-hidden="true" />
            Book Free Strategy Session
          </a>
        </Button>
      </div>
    </div>
  );
}
