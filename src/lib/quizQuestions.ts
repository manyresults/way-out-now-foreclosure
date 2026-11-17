// Shared by the quiz UI and the server-side GHL payload (answer codes -> readable labels).
export type Question = {
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

export const questions: Question[] = [
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
