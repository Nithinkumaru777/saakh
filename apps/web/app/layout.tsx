import type { Metadata } from "next";
import { Geist, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"], axes: ["opsz"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const TITLE = "Saakh - AI-Based Loan Eligibility & Risk Assessment System";
const DESCRIPTION = "AI-based loan eligibility and risk assessment. AI for Finance CIA-2, Topic 4. NITHIN KUMAR U, USN 2102508611.";

export const metadata: Metadata = {
  // NEXT_PUBLIC_SITE_URL makes the social preview image an absolute link once the site has a real domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: TITLE, template: "%s | Saakh" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Saakh",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/tutorial/poster.jpg", alt: "Saakh loan risk assessment" }],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
