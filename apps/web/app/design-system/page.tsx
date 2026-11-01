import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonStates } from "./button-states";

export const metadata: Metadata = { title: "Design system, Saakh" };

const GROUPS: { title: string; tokens: string[] }[] = [
  { title: "Surfaces and rules", tokens: ["canvas", "sheet", "sheet-2", "rule", "rule-strong", "dot"] },
  { title: "Ink", tokens: ["ink", "ink-2", "ink-3"] },
  { title: "Haldi, the one accent", tokens: ["haldi", "haldi-hover", "haldi-wash", "haldi-edge"] },
  { title: "Decisions", tokens: ["sanction", "sanction-wash", "refer", "refer-wash", "decline", "decline-wash"] },
  { title: "Grades A to E", tokens: ["grade-a", "grade-b", "grade-c", "grade-d", "grade-e"] },
  { title: "Charts", tokens: ["chart-1", "chart-2", "chart-3", "chart-4"] },
];

const TYPE: { cls: string; name: string; spec: string; sample: string }[] = [
  { cls: "display-xl", name: "display-xl", spec: "Source Serif 4 600, clamp 46 to 92", sample: "Credit, read like a report" },
  { cls: "display-m", name: "display-m", spec: "Source Serif 4 600, 44/48", sample: "Applicants" },
  { cls: "display-l", name: "display-l", spec: "Source Serif 4 600, 36/42", sample: "Sanctioned at an indicative 9.4%" },
  { cls: "figure-xl", name: "figure-xl", spec: "Geist 600, 64/64, tabular", sample: "4.2%" },
  { cls: "figure-l", name: "figure-l", spec: "Geist 600, 36/40, tabular", sample: "₹12,50,000" },
  { cls: "type-title", name: "title", spec: "Geist 600, 28/34", sample: "Risk factors" },
  { cls: "type-subtitle", name: "subtitle", spec: "Geist 600, 20/28", sample: "Repayment capacity" },
  { cls: "type-body", name: "body", spec: "Geist 400, 16/26", sample: "A salaried applicant earning ₹85,000 a month, CIBIL 760, asks for ₹8,00,000 over 48 months." },
  { cls: "type-ui", name: "ui", spec: "Geist 500, 14/20", sample: "Monthly income" },
  { cls: "type-small", name: "small", spec: "Geist 500, 13/18", sample: "Estimated default risk. Indicative only." },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-14 px-6 py-14">
      <header className="flex items-end justify-between gap-6 border-b border-ink pb-4">
        <div>
          <h1 className="display-m m-0">Design system</h1>
          <p className="type-body m-0 mt-2 text-ink-2">Ink and Haldi, with the Night ledger dark theme. Every token, type step and button state used by Saakh.</p>
        </div>
        <ThemeToggle />
      </header>

      <section aria-labelledby="colour" className="flex flex-col gap-6">
        <h2 id="colour" className="type-title m-0">Colour tokens</h2>
        {GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-3">
            <h3 className="type-subtitle m-0">{g.title}</h3>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
              {g.tokens.map((t) => (
                <li key={t} className="hairline rounded-panel bg-sheet">
                  <div className="h-16 border-b border-rule" style={{ background: `var(--${t})` }} />
                  <span className="type-small block px-3 py-2 text-ink-2">--{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="type" className="flex flex-col gap-4">
        <h2 id="type" className="type-title m-0">Typography</h2>
        <div className="hairline rounded-panel bg-sheet">
          {TYPE.map((t) => (
            <div key={t.name} className="grid grid-cols-1 gap-2 border-b border-rule px-5 py-4 last:border-b-0 md:grid-cols-[200px_1fr]">
              <div className="type-small text-ink-3">
                <span className="block text-ink-2">{t.name}</span>
                {t.spec}
              </div>
              <p className={`${t.cls} m-0`}>{t.sample}</p>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[200px_1fr]">
            <div className="type-small text-ink-3"><span className="block text-ink-2">stamp</span>Geist 800, uppercase, +0.12em</div>
            <span className="stamp-text w-fit rounded-stamp border-2 border-sanction px-3 py-1 text-sanction">Sanctioned</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="buttons" className="flex flex-col gap-4">
        <h2 id="buttons" className="type-title m-0">NeoPOP buttons</h2>
        <p className="type-body m-0 text-ink-2">Press: the face drops 4 px onto its edge in 90 ms and returns in 160 ms. Hover an icon button to play its icon.</p>
        <div className="hairline rounded-panel bg-sheet p-6">
          <ButtonStates />
        </div>
      </section>

      <section aria-labelledby="shape" className="flex flex-col gap-4">
        <h2 id="shape" className="type-title m-0">Shape, elevation and canvas</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="hairline rounded-panel bg-sheet p-5">
            <p className="type-ui m-0">Flat panel</p>
            <p className="type-small m-0 text-ink-3">1 px rule border, 2 px radius, no shadow.</p>
          </div>
          <div className="pop rounded-panel bg-sheet p-5">
            <p className="type-ui m-0">Elevated sheet</p>
            <p className="type-small m-0 text-ink-3">1.5 px ink border, 6 px solid ink offset. Assessment Sheet and dialogs only.</p>
          </div>
          <div className="hairline rounded-panel p-5" aria-label="Dot grid sample">
            <p className="type-ui m-0">Dot-grid canvas</p>
            <p className="type-small m-0 text-ink-3">1 px dot every 20 px, shows through this panel.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
