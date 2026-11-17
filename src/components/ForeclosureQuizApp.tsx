"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useReferrals } from "@/hooks/use-referrals";
import { ResultsView } from "@/components/ResultsView";
import { LandingAbout } from "@/components/LandingAbout";
import Image from "next/image";
import { generateResults as buildResults } from "@/lib/routing";
import { questions } from "@/lib/quizQuestions";
import { CheckCircle2, ChevronRight, ArrowRight, Home, Calendar } from "lucide-react";

const isResultsPath = (path: string) => path === "/thank-you" || path.startsWith("/results/");

export function ForeclosureQuizApp({ initialData, initialAnswers }: { initialData?: string; initialAnswers?: Record<string, string | string[]> }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  
  const [step, setStep] = useState(() => {
    return isResultsPath(pathname) ? 7 : 0;
  });
  
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
    if (initialAnswers) return initialAnswers;
    if (initialData) {
      try {
        return JSON.parse(atob(initialData));
      } catch (e) {
        console.error("Failed to parse data param", e);
      }
    }
    return {};
  });
  
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const referrals = useReferrals();
  const generateResults = () => buildResults(answers, referrals);

  useEffect(() => {
    if (isResultsPath(pathname)) {
      if (!answers || !answers.q1) {
        router.replace("/");
      } else if (step !== 7) {
        setStep(7);
      }
    } else if (pathname === "/" && step === 7) {
      setStep(0);
    }
  }, [pathname, answers, step, router]);

  const handleRadio = (qId: string, value: string) => {
    setAnswers({ ...answers, [qId]: value });
  };

  const handleCheckbox = (qId: string, value: string) => {
    const current = (answers[qId] as string[]) || [];
    if (current.includes(value)) {
      setAnswers({ ...answers, [qId]: current.filter((v) => v !== value) });
    } else {
      setAnswers({ ...answers, [qId]: [...current, value] });
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");

    // Where this visitor came from (ads, email, social), for the CRM.
    const params = new URLSearchParams(window.location.search);
    const attribution: Record<string, string> = { landing_url: window.location.href, referrer: document.referrer };
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]) {
      const value = params.get(key);
      if (value) attribution[key] = value;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: formData, answers, attribution, website: honeypot }),
      });
      if (!res.ok) throw new Error(`submit ${res.status}`);
      const { redirect } = (await res.json()) as { redirect: string };
      router.push(redirect);
    } catch (err) {
      console.error("Quiz submission failed", err);
      setSubmitError("Something went wrong on our end and we couldn't save your information. Please check your details and try again, or call us at 215-999-7208.");
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 0: Landing
  // ---------------------------------------------------------------------------
  if (step === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in zoom-in duration-500 pb-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 mb-4">
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase">
              Helping Pennsylvania Homeowners Find Their Way
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto text-foreground leading-tight">
              See Exactly Which Relief Programs <span className="text-primary relative whitespace-nowrap"><span className="relative z-10">You Qualify For</span><svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary -z-0" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent"/></svg></span>
            </h1>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4 text-center text-lg md:text-xl text-muted-foreground">
            <p>
              If you're behind on payments, facing foreclosure, or struggling to sell your home, you have more options than you might realize. Many powerful public resources exist to help, but few homeowners know where to find them.
            </p>
            <p>
              At Way Out Now, we believe the first step to solving a problem is understanding your choices. Take this free assessment to get a personalized action plan with trusted resources and clear next steps to protect your equity.
            </p>
          </div>

          <div className="pt-4">
            <Button size="lg" onClick={nextStep} className="text-lg px-8 py-6 h-auto font-semibold rounded-full group">
              Start Your Assessment
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
              100% Confidential &amp; Free
            </p>
          </div>
        </div>

        {/* About us + mission */}
        <LandingAbout onStart={nextStep} />

        {/* Why Choose Us Section */}
        <div className="bg-secondary/10 rounded-3xl p-8 md:p-12 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Why Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The Benefits of Working with Way Out Now. We're more than homebuyers — we're problem solvers. Our process is built on clarity, compassion, and care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-4 bg-background p-6 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Real Options, No Pressure</h3>
              <p className="text-muted-foreground">We help you understand every path available — from staying in your home to selling quickly or restructuring your loan.</p>
            </div>
            <div className="space-y-4 bg-background p-6 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Fast, Flexible Solutions</h3>
              <p className="text-muted-foreground">We move at your pace. Whether you need time to plan or a quick close, we adapt to your timeline and comfort level.</p>
            </div>
            <div className="space-y-4 bg-background p-6 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Human Support, Local Expertise</h3>
              <p className="text-muted-foreground">Our Philadelphia-based team knows the market, the process, and the emotional weight behind every decision.</p>
            </div>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">Get started today</h2>
            <p className="text-lg text-muted-foreground">
              Take the first step towards clarity. Our free assessment will help identify the best resources and options for your specific situation.
            </p>
            <Button size="lg" onClick={nextStep} className="text-lg px-8 py-6 h-auto font-semibold rounded-full group">
              Start Your Assessment Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div>
            <Image
              src="/images/neighborhood-aerial.jpg"
              alt="Aerial view of a residential neighborhood"
              width={665}
              height={459}
              sizes="(min-width: 768px) 480px, 100vw"
              className="rounded-2xl shadow-xl w-full object-cover aspect-video"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEPS 1-5: Questions
  // ---------------------------------------------------------------------------
  if (step >= 1 && step <= 5) {
    const qIndex = step - 1;
    const q = questions[qIndex];
    let isAnswered = false;
    
    if (q.type === "radio") {
      isAnswered = !!answers[q.id];
    } else if (q.type === "checkbox") {
      isAnswered = q.optional ? true : (answers[q.id] as string[])?.length > 0;
    }

    return (
      <div className="max-w-2xl mx-auto animate-in slide-in-from-right-8 fade-in duration-300">
        <div className="mb-8 flex justify-between items-center">
          <span className="text-sm font-bold text-primary uppercase tracking-wider">Assessment</span>
          <span className="text-sm text-muted-foreground">{step} / 5</span>
        </div>
        
        <div className="h-2 w-full bg-secondary rounded-full mb-12 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <h2 className="text-3xl font-bold mb-8 leading-tight">{q.title}</h2>

        <div className="space-y-4 mb-12">
          {q.type === "radio" ? (
            <RadioGroup 
              onValueChange={(val) => handleRadio(q.id, val)} 
              value={answers[q.id] as string} 
              className="space-y-3"
            >
              {q.options.map((opt) => (
                <div key={opt.value} className="flex items-start space-x-3 border-2 border-border p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value={opt.value} id={opt.value} className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={opt.value} className="text-lg font-medium cursor-pointer block">{opt.label}</Label>
                    {opt.desc && <p className="text-sm text-muted-foreground mt-1 cursor-pointer" onClick={() => handleRadio(q.id, opt.value)}>{opt.desc}</p>}
                  </div>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {q.options.map((opt) => {
                const isChecked = ((answers[q.id] as string[]) || []).includes(opt.value);
                return (
                  <div 
                    key={opt.value} 
                    className={`flex items-start space-x-3 border-2 p-4 rounded-xl transition-colors cursor-pointer ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onClick={() => handleCheckbox(q.id, opt.value)}
                  >
                    <Checkbox 
                      id={opt.value} 
                      checked={isChecked}
                      onCheckedChange={() => handleCheckbox(q.id, opt.value)}
                      className="w-5 h-5 mt-0.5" 
                    />
                    <div className="flex-1">
                      <Label htmlFor={opt.value} className="text-lg font-medium cursor-pointer block">{opt.label}</Label>
                      {opt.desc && <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={prevStep} className="text-muted-foreground">
            Back
          </Button>
          <Button size="lg" onClick={nextStep} disabled={!isAnswered} className="px-8 rounded-full">
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Lead Capture
  // ---------------------------------------------------------------------------
  if (step === 6) {
    return (
      <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-8 fade-in duration-500">
        <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl mb-2">Analyzing Your Options</CardTitle>
            <CardDescription className="text-lg">
              Where should we send your personalized resource guide and action plan?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    required 
                    placeholder="Jane" 
                    className="p-6 text-lg bg-background"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    required 
                    placeholder="Doe" 
                    className="p-6 text-lg bg-background"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  required
                  placeholder="(555) 123-4567" 
                  className="p-6 text-lg bg-background"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  placeholder="jane@example.com" 
                  className="p-6 text-lg bg-background"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              {/* Spam trap: hidden from people, bots tend to fill it. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>
              <div className="text-xs text-muted-foreground text-center mt-4">
                By continuing, you agree to receive communications regarding your options. Se habla español.
              </div>
              {submitError && (
                <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full text-lg py-6 h-auto font-bold mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Generating Plan..." : "View My Results"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 7: Results
  // ---------------------------------------------------------------------------
  if (step === 7) {
    if (referrals.isLoading) {
      return <div className="text-center text-lg text-muted-foreground py-24">Building your personalized plan…</div>;
    }
    return (
      <ResultsView
        answers={answers}
        results={generateResults()}
        bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL || "#"}
        showSaveLink={pathname.startsWith("/results/")}
      />
    );
  }

  return null;
}
