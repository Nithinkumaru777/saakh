import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Saakh: loan eligibility and risk assessment",
  description: "AI-based loan eligibility and risk assessment. AI for Finance CIA-2, Topic 4. NITHIN KUMAR U, USN 2102508611.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
