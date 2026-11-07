import { test as base, expect, type Page } from "@playwright/test";

/** "web" = website 1 (Next.js + FastAPI). "pages" = website 2 (static GitHub Pages build). */
export const SITE = (process.env.SAAKH_SITE || "web") as "web" | "pages";
export const IS_WEB = SITE === "web";

export const VIEWS = ["home", "assess", "what-if", "applicants", "batch", "portfolio", "model", "tutorials", "about", "login", "profile"] as const;
export type View = (typeof VIEWS)[number];
// Website 2 has no server-side data to protect, and its home page links straight to the tutorials.
export const PUBLIC_VIEWS: View[] = IS_WEB ? ["home", "about", "model", "login"] : ["home", "about", "model", "login", "tutorials"];
export const H1: Record<View, string> = {
  home: "Know the risk before you lend.",
  assess: "Assess an application",
  "what-if": "What if the numbers changed?",
  applicants: "Applicants",
  batch: "Score a batch",
  portfolio: "Portfolio",
  model: "How the AI decides",
  tutorials: IS_WEB ? "Tutorial videos" : "Tutorials",
  about: "About this project",
  login: "Sign in",
  profile: "Your profile",
};

/** Records every console error, uncaught exception, failed request and HTTP error for the whole test. */
export class Guard {
  problems: string[] = [];
  // The Google Fonts stylesheet has a system font fallback, so this machine's internet dropping is not a site failure. HTTP errors from it still count.
  private allowed: RegExp[] = [/fonts\.(googleapis|gstatic)\.com.*net::ERR_|net::ERR_.*fonts\.(googleapis|gstatic)\.com/];
  /** A test that deliberately provokes a 4xx names it here, so anything else still fails. */
  allow(re: RegExp) {
    this.allowed.push(re);
  }
  add(msg: string) {
    if (!this.allowed.some((re) => re.test(msg))) this.problems.push(msg);
  }
  attach(page: Page) {
    page.on("pageerror", (e) => this.add(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") this.add(`console: ${m.text()} @ ${m.location().url}`);
    });
    page.on("requestfailed", (r) => {
      const err = r.failure()?.errorText || "";
      // Leaving a page cancels media, SSE and in-flight fetches. That is not a failure.
      if (err === "net::ERR_ABORTED" && /\.mp4|\/api\/events|\/api\/score|[?&]_rsc=/.test(r.url())) return;
      this.add(`requestfailed: ${r.method()} ${r.url()} ${err}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400) this.add(`http ${r.status()}: ${r.request().method()} ${r.url()}`);
    });
  }
}

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page }, use) => {
      const g = new Guard();
      g.attach(page);
      await use(g);
      expect(g.problems, "console errors / failed requests during this test").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 768;
}

function urlFor(view: View) {
  if (!IS_WEB) return `./#${view}`;
  return view === "home" ? "/" : `/${view}`;
}

export async function goto(page: Page, view: View) {
  await page.goto(urlFor(view));
  await expectView(page, view);
}

/** Moves between views in-app (hash navigation), keeping page state. */
export async function hashTo(page: Page, view: View) {
  await page.evaluate((v) => { location.hash = v; }, view);
  await expectView(page, view);
}

export async function expectView(page: Page, view: View) {
  await expect(page.locator(`.view[data-view="${view}"].on`)).toBeVisible();
  // Public pages are visible in the server's HTML, so also wait for the page script to have taken over.
  await expect(page.locator("[data-route][aria-current]").first()).toBeAttached();
}

let seq = 0;
export function uniqueEmail() {
  return `audit.${Date.now()}.${process.pid}.${seq++}@example.com`;
}
export const PASSWORD = "Audit2026pass";

/** Registers a brand-new account through the real form. Leaves the page on Assess. */
export async function signIn(page: Page, name = "Audit Tester") {
  const email = uniqueEmail();
  await goto(page, "login");
  await page.locator('#authSeg button[data-v="register"]').click();
  await page.fill("#fa_name", name);
  await page.fill("#fa_email", email);
  await page.fill("#fa_pw", PASSWORD);
  await page.click("#authSubmit");
  await expectView(page, "assess");
  return email;
}

/** On phones the assessment sheet is a bottom drawer; open it before using its controls. */
export async function openSheet(page: Page) {
  if (isMobile(page)) {
    const open = await page.locator("#asheet").evaluate((e) => e.classList.contains("open"));
    if (!open) await page.click("#peek");
    await page.waitForTimeout(450);
  }
}

export async function closeSheet(page: Page) {
  if (isMobile(page)) {
    const open = await page.locator("#asheet").evaluate((e) => e.classList.contains("open"));
    if (open) await page.click("#peek");
    await page.waitForTimeout(450);
  }
}

/** Overflow, off-screen controls, clipped text and overlapping text in the current view. Returns readable problems. */
export async function layoutIssues(page: Page): Promise<string[]> {
  await page.waitForTimeout(350); // let entrance animations finish
  return page.evaluate(() => {
    const out: string[] = [];
    const de = document.documentElement;
    const vw = de.clientWidth;
    const name = (e: Element) => `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${typeof (e as HTMLElement).className === "string" && (e as HTMLElement).className ? "." + (e as HTMLElement).className.trim().split(/\s+/).join(".") : ""}`;
    const shown = (e: Element) => {
      const r = e.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) return false;
      for (let n: Element | null = e; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
      }
      return true;
    };
    const scroller = (e: Element) => {
      for (let n = e.parentElement; n; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if ((o === "auto" || o === "scroll") && n !== document.body && n !== de) return true;
      }
      return false;
    };
    const all = [...document.querySelectorAll("body *")].filter((e) => !e.closest("svg") && !e.closest("#toasts") && !e.closest(".sr"));

    if (de.scrollWidth > vw + 1) {
      const wide = all.filter((e) => shown(e) && !scroller(e) && e.getBoundingClientRect().right > vw + 1).slice(0, 5).map(name);
      out.push(`horizontal scroll: page ${de.scrollWidth}px wide in a ${vw}px window (${wide.join(", ")})`);
    }
    for (const e of all) {
      if (!e.matches("a,button,input,select,textarea,label.btn,[tabindex='0']") || !shown(e) || scroller(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) out.push(`off-screen control: ${name(e)} spans ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`);
    }
    for (const e of all) {
      if (!shown(e) || e.matches("input,select,textarea")) continue;
      const hasText = [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim());
      if (!hasText) continue;
      const o = getComputedStyle(e);
      if (!(o.overflowX === "hidden" || o.overflowX === "clip") || e.scrollWidth <= e.clientWidth + 1) continue;
      // A deliberate ellipsis is fine only when the full text is still available on hover.
      const full = e.closest("[title]")?.getAttribute("title") || "";
      if (o.textOverflow === "ellipsis" && full.includes(e.textContent!.trim())) continue;
      out.push(`cut-off text: ${name(e)} "${e.textContent!.trim().slice(0, 40)}"`);
    }
    // Overlapping text: compare the painted rectangle of every visible text node.
    const boxes: { r: DOMRect; t: string; n: Text; drawer: boolean }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      const p = n.parentElement!;
      // The sticky top bar, fixed tab bar and phone drawer float over scrolling content by design.
      if (!n.textContent!.trim() || p.closest("svg,#toasts,.sr,script,style,option,#stamp,.topbar,.tabbar,.asheet .peek") || !shown(p)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      // A range's box is the font's full height, far taller than the glyphs in tight display type. Use the line box.
      const lh = parseFloat(getComputedStyle(p).lineHeight);
      for (const c of rg.getClientRects()) {
        if (c.width <= 1 || c.height <= 1) continue;
        const h = lh && lh < c.height ? lh : c.height;
        // Text shortened with an ellipsis still reports its full width; only the part inside the box is painted.
        const right = getComputedStyle(p).overflowX === "visible" ? c.right : Math.min(c.right, p.getBoundingClientRect().right);
        const r = new DOMRect(c.left, c.top + (c.height - h) / 2, right - c.left, h);
        boxes.push({ r, t: n.textContent!.trim().slice(0, 30), n, drawer: !!p.closest(".asheet") && getComputedStyle(p.closest(".asheet")!).position === "fixed" });
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        // The phone drawer floats over the page by design; text inside it is still compared with itself.
        if (a.n === b.n || a.drawer !== b.drawer) continue;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        // Line boxes legitimately touch by a few px; 40% of the shorter line is a real collision.
        if (w > 2 && h > 0.4 * Math.min(a.r.height, b.r.height)) out.push(`overlapping text: "${a.t}" / "${b.t}"`);
      }
    }
    return [...new Set(out)];
  });
}

/** Every visible control in the view must receive a click at its centre (nothing covering it). */
export async function unclickable(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const root = document.querySelector(".view.on") || document.body;
    const ctrls = [...root.querySelectorAll("a,button:not(:disabled),input:not(:disabled),select,textarea,label.btn,[tabindex='0']")];
    for (const e of ctrls) {
      const el = e as HTMLElement;
      if (el.closest(".sr") || el.matches(".sr")) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" as ScrollBehavior });
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit) continue;
      const lab = el.closest("label");
      if (el.contains(hit) || hit.contains(el) || (lab && lab.contains(hit))) continue;
      const label = (el.textContent || el.getAttribute("aria-label") || el.id || el.tagName).trim().slice(0, 40);
      out.push(`covered: "${label}" by ${hit.tagName.toLowerCase()}.${String((hit as HTMLElement).className).slice(0, 40)}`);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    return [...new Set(out)];
  });
}

export function csvTemplateRow(over: Record<string, string> = {}) {
  const cols = ["full_name", "age", "employment_type", "years_in_job", "city_tier", "dependents", "residence", "monthly_income", "other_monthly_income", "cibil_score", "credit_history_years", "open_credit_lines", "credit_utilisation_pct", "missed_payments_24m", "enquiries_6m", "past_default", "existing_emi", "outstanding_debt", "loan_type", "loan_amount", "tenure_months", "collateral_value", "purpose"];
  const vals: Record<string, string> = { full_name: "Aarav Sharma", age: "29", employment_type: "salaried", years_in_job: "4.5", city_tier: "1", dependents: "0", residence: "rented", monthly_income: "85000", other_monthly_income: "0", cibil_score: "760", credit_history_years: "5", open_credit_lines: "3", credit_utilisation_pct: "22.5", missed_payments_24m: "0", enquiries_6m: "1", past_default: "false", existing_emi: "10000", outstanding_debt: "120000", loan_type: "personal", loan_amount: "500000", tenure_months: "36", collateral_value: "0", purpose: "Home improvement", ...over };
  return { header: cols.join(","), row: cols.map((c) => vals[c]).join(",") };
}
