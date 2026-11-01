import Link from "next/link";

// Phase 0 placeholder. The real landing (sentence-form live demo, ledger band) arrives in a later phase.
export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24">
      <h1 className="display-xl m-0 max-w-[14ch]">Saakh reads an application like a credit report.</h1>
      <p className="type-body mt-6 max-w-[68ch] text-ink-2">
        AI-based loan eligibility and risk assessment. AI for Finance CIA-2, Topic 4.
      </p>
      <Link href="/design-system" className="type-ui text-ink underline underline-offset-4">View the design system</Link>
    </main>
  );
}
