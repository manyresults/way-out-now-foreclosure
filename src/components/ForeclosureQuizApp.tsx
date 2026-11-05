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
import { generateResults as buildResults } from "@/lib/routing";
import { CheckCircle2, ChevronRight, ArrowRight, Home, AlertTriangle, ExternalLink, Calendar, Info } from "lucide-react";

type StandardTrackingFieldKey = string;
type RegisteredCustomFieldId = string;
type TrackingCustomField = { value?: unknown; label: string };
type TrackingFileField = { file?: File; label: string };
type TrackingImageDataField = { dataUrl?: string; label: string };

const postTrackingEvent = async (
  trackingPayload: Record<string, unknown> & {
    formData: Record<StandardTrackingFieldKey, unknown>;
    formLabels: Record<StandardTrackingFieldKey, string>;
  },
  options: {
    customFields?: Record<RegisteredCustomFieldId, TrackingCustomField>;
    fileFields?: Record<RegisteredCustomFieldId, TrackingFileField>;
    imageDataFields?: Record<RegisteredCustomFieldId, TrackingImageDataField>;
  } = {},
) => {
  const { customFields = {}, fileFields = {}, imageDataFields = {} } = options;
  const eventPayload = {
    ...trackingPayload,
    formData: { ...trackingPayload.formData },
    formLabels: { ...trackingPayload.formLabels },
  };
  const body = new FormData();

  for (const [key, field] of Object.entries(customFields)) {
    if (field.value === undefined) continue;
    eventPayload.formData[key] = field.value;
    eventPayload.formLabels[key] = field.label;
  }

  for (const [key, field] of Object.entries(imageDataFields)) {
    const dataUrl = field.dataUrl;
    if (!dataUrl) continue;
    if (!dataUrl.startsWith("data:image/")) {
      throw new Error("Image data field must be a data:image/* base64 string");
    }
    eventPayload.formData[key] = dataUrl;
    eventPayload.formLabels[key] = field.label;
  }

  for (const [key, field] of Object.entries(fileFields)) {
    const file = field.file;
    if (!file) continue;
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File must be 50 MB or smaller");
    }
    eventPayload.formData[key] = {
      filename: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    };
    eventPayload.formLabels[key] = field.label;
    body.append(key, file, file.name);
  }

  for (const key of Object.keys(eventPayload.formData)) {
    eventPayload.formLabels[key] ||= key;
  }

  body.append("event", JSON.stringify(eventPayload));

  try {
    // Hidden iframe workaround for CORS bypass when exported
    const iframeName = 'hidden_iframe_' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://backend.leadconnectorhq.com/external-tracking/events';
    form.target = iframeName;
    form.enctype = 'multipart/form-data';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'event';
    input.value = JSON.stringify(eventPayload);
    form.appendChild(input);

    for (const [key, field] of Object.entries(fileFields)) {
      if (field.file) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = key;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(field.file);
        fileInput.files = dataTransfer.files;
        form.appendChild(fileInput);
      }
    }

    document.body.appendChild(form);
    form.submit();

    // Clean up after a short delay
    setTimeout(() => {
      if (document.body.contains(form)) document.body.removeChild(form);
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 3000);
  } catch (err) {
    console.error("Tracking error", err);
  }
};

type Question = {
  id: string;
  title: string;
  type: "radio" | "checkbox";
  optional?: boolean;
  options: {
    value: string;
    label: string;
    desc?: string;
  }[];
};

const questions: Question[] = [
  {
    id: "q1",
    title: "Where do things stand right now?",
    type: "radio",
    options: [
      { value: "pre", label: "I'm behind, but no notice yet", desc: "Missed payments or worried I will — nothing formal has arrived" },
      { value: "notice", label: "I received a foreclosure notice", desc: "A default or intent-to-foreclose letter has come from the lender" },
      { value: "active", label: "I'm already in foreclosure", desc: "A lawsuit has been filed, or a sheriff sale date is scheduled" },
    ],
  },
  {
    id: "q2",
    title: "How many payments are you behind?",
    type: "radio",
    options: [
      { value: "0", label: "Current, just worried" },
      { value: "1-2", label: "1–2 behind" },
      { value: "3+", label: "3 or more behind" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q3",
    title: "Has a sheriff sale or auction date been set?",
    type: "radio",
    options: [
      { value: "yes", label: "Date set" },
      { value: "no", label: "No date yet" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q4",
    title: "What is your primary goal?",
    type: "radio",
    options: [
      { value: "keep", label: "Keep the house", desc: "Catch up, modify the loan, or stop the process" },
      { value: "sell", label: "Sell and move on", desc: "Get out from under it, on the best terms possible" },
      { value: "unsure", label: "I don't know yet", desc: "I want to see every option before deciding" },
    ],
  },
  {
    id: "q5",
    title: "What is the main cause of the hardship? (Select all that apply)",
    type: "checkbox",
    optional: true,
    options: [
      { value: "income", label: "Income loss / job change" },
      { value: "medical", label: "Medical / illness" },
      { value: "divorce", label: "Divorce / separation" },
      { value: "death", label: "Death in family" },
      { value: "inherited", label: "Inherited / vacant property" },
      { value: "other", label: "Something else" },
    ],
  },
];

export function ForeclosureQuizApp({ initialData }: { initialData?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [step, setStep] = useState(() => {
    return pathname === "/thank-you" ? 7 : 0;
  });
  
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
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
  const referrals = useReferrals();
  const generateResults = () => buildResults(answers, referrals);

  useEffect(() => {
    if (pathname === "/thank-you") {
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
    setIsSubmitting(true);
    
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    // Generate results summary for CRM
    const results = generateResults();
    let resultsSummary = `Status: ${answers.q1}\nPayments Behind: ${answers.q2}\nSale Date: ${answers.q3}\nGoal: ${answers.q4}\nHardships: ${Array.isArray(answers.q5) ? answers.q5.join(', ') : answers.q5}\n\n`;
    resultsSummary += `RESOURCES:\n${results.resources.map(r => `- ${r.name}: ${r.link}`).join('\n')}\n\n`;
    resultsSummary += `PARTNERS:\n${results.affiliates.map(p => `- ${p.name}: ${p.link}`).join('\n')}`;

    const trackingPayload = {
      type: "external_form_submission",
      timestamp: Date.now(),
      formId: "Foreclosure Quiz Assessment",
      formData: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: fullName, 
        email: formData.email,
        phone: formData.phone,
      },
      formLabels: {
        first_name: "First Name",
        last_name: "Last Name",
        name: "Full Name",
        email: "Email",
        phone: "Phone",
      },
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      trackingId: "tk_22f6411a65374540a7215cef24c21599",
      locationId: "fqegmPESSsh8C2xvYWai",
      sessionId: crypto.randomUUID(),
      properties: {
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
      },
    };

    const answersData = btoa(JSON.stringify(answers));
    const permalink = `${window.location.origin}/thank-you?data=${encodeURIComponent(answersData)}`;

    await postTrackingEvent(trackingPayload, {
      customFields: {
        "4y57aA1fTDG3QdeCMBVx": { value: answers.q1, label: "Foreclosure Status" },
        "loeyZ7V4TY6VAf3r0UgD": { value: answers.q2, label: "Payments Behind" },
        "GPsmDYOkIGseylA7HETb": { value: answers.q3, label: "Sale Date Set" },
        "tVjgVMqp9ppOrIJeliUI": { value: answers.q4, label: "Goal" },
        "cAhVdfuedHyTYuoOz665": { value: Array.isArray(answers.q5) ? answers.q5.join(", ") : answers.q5, label: "Hardship" },
        "kx1cIiHVDbbc9Bk3o28p": { value: resultsSummary, label: "Foreclosure Quiz Results" },
        "S1pI1XMuvBVkKtzJstL1": { value: permalink, label: "Results URL" },
      }
    });

    router.push(`/thank-you?data=${encodeURIComponent(answersData)}`);
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
              Stop the Guesswork
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
            <img 
              src="https://vibe.filesafe.space/1783028068564314446/assets/14835ee9-80f6-4514-90d7-ead2bb14e7c5.png" 
              alt="Real estate consultation" 
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
              <div className="text-xs text-muted-foreground text-center mt-4">
                By continuing, you agree to receive communications regarding your options. Se habla español.
              </div>
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
    const results = generateResults();

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
        
        {/* Dynamic Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-full tracking-wider mb-6">
            {results.header.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{results.header.title}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {results.header.desc}
          </p>
        </div>

        {/* Primary CTA Section */}
        <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-3xl shadow-lg mb-16 text-center">
          <h3 className="text-3xl font-bold mb-4">Book Your Free Strategy Session</h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            {results.ctaCopy}
          </p>
          <Button size="lg" variant="secondary" className="px-8 py-6 h-auto text-lg font-bold rounded-full w-full md:w-auto" asChild>
            <a href={process.env.NEXT_PUBLIC_BOOKING_URL || "#"} target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 w-5 h-5" />
              Book Free Strategy Session
            </a>
          </Button>
        </div>

        {/* Free Resources Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-secondary rounded-lg">
              <Info className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Recommended Free Resources</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {results.resources.map((res, idx) => (
              <Card key={idx} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{res.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground">{res.desc}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={res.link} target="_blank" rel="noopener noreferrer">
                      Visit Website <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Affiliate Offers Section */}
        {results.affiliates.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Approved Partner Programs</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {results.affiliates.map((aff, idx) => (
                <Card key={idx} className="border-primary/20 bg-primary/5 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{aff.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-foreground/80">{aff.desc}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href={aff.link} target="_blank" rel="noopener noreferrer">
                        Check Eligibility <ExternalLink className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
}
