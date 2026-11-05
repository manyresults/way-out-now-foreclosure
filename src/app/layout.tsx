import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Find Your Way Out — Foreclosure Exit Plan | Way Out Now",
  description:
    "Answer five quick questions and see exactly which foreclosure relief programs, free resources, and partner options fit your situation.",
  openGraph: {
    title: "Find Your Way Out — Foreclosure Exit Plan",
    description: "Answer five quick questions and see which foreclosure relief options you qualify for.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
