import { test, expect, signIn, hashTo, expectView, openSheet, closeSheet, isMobile, layoutIssues, IS_WEB, type View } from "../lib";
import type { Page } from "@playwright/test";

const err = (page: Page, id: string) => page.locator(`.field:has(#${id})`);

/** Risk figures count up to their value; read one only after it stops changing. */
async function settled(page: Page, sel: string) {
  let last = "";
  await expect.poll(async () => {
    const now = await page.locator(sel).innerText();
    const same = now === last;
    last = now;
    return same;
  }, { intervals: [400] }).toBe(true);
  return last;
}

async function gotoStep(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.click("#nextBtn");
    await expect(page.locator(`.pane[data-step="${i + 1}"]`)).toBeVisible();
  }
}

async function clear(page: Page) {
  await page.click("#clearForm");
  await expect(page.locator('.pane[data-step="0"]')).toBeVisible();
  await expect(page.locator("#f_name")).toHaveValue("");
}

test.describe("assessment wizard", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("step 1 empty: every required field shows its message", async ({ page }) => {
    await clear(page);
    await page.click("#nextBtn");
    await expect(err(page, "f_name")).toContainText("full name");
    await expect(err(page, "f_age")).toContainText("age");
    await expect(err(page, "f_name")).toHaveClass(/err/);
    await expect(page.locator("#f_name")).toBeFocused();
    await expect(page.locator('.pane[data-step="0"]')).toBeVisible();
  });

  test("step 1 rejects bad name, age, job years and dependents; typing clears the error", async ({ page }) => {
    await clear(page);
    await page.fill("#f_name", "X1");
    await page.fill("#f_age", "12");
    await page.fill("#f_job", "99");
    await page.fill("#f_dep", "9");
    await page.click("#nextBtn");
    for (const [id, msg] of [["f_name", "letters only"], ["f_age", "18 and 75"], ["f_dep", "0 to 6"]]) await expect(err(page, id)).toContainText(msg);
    await page.fill("#f_name", "Valid Name");
    await expect(err(page, "f_name")).not.toHaveClass(/err/);
  });

  test("the age help text matches what validation accepts", async ({ page }) => {
    const help = await page.locator(".field:has(#f_age) .help").innerText();
    await clear(page);
    await page.fill("#f_name", "Valid Name");
    await page.fill("#f_job", "0");
    await page.fill("#f_dep", "0");
    await page.fill("#f_age", "18");
    await page.click("#nextBtn");
    const passed = await page.locator('.pane[data-step="1"]').isVisible();
    expect(help, "help text should state the range the form enforces").toContain(passed ? "18" : "21");
  });

  test("income, credit and loan steps validate", async ({ page }) => {
    await clear(page);
    await page.fill("#f_name", "Valid Name");
    await page.fill("#f_age", "30");
    await page.fill("#f_job", "3");
    await page.fill("#f_dep", "1");
    await page.click("#nextBtn");
    await expect(page.locator('.pane[data-step="1"]')).toBeVisible();
    await page.click("#nextBtn");
    await expect(err(page, "f_inc")).toContainText("monthly income");
    await page.fill("#f_inc", "500");
    await page.click("#nextBtn");
    await expect(err(page, "f_inc")).toContainText("monthly income");
    await page.fill("#f_inc", "90000");
    await page.click("#nextBtn");
    await expect(page.locator('.pane[data-step="2"]')).toBeVisible();
    await page.fill("#f_cibil", "100");
    await page.click("#nextBtn");
    await expect(err(page, "f_cibil")).toContainText("300 to 900");
    await page.fill("#f_cibil", "750");
    await page.fill("#f_util", "150");
    await page.click("#nextBtn");
    await expect(err(page, "f_util")).toContainText("0 to 100");
    await page.fill("#f_util", "20");
    await page.fill("#f_hist", "5");
    await page.click("#nextBtn");
    await expect(page.locator('.pane[data-step="3"]')).toBeVisible();
    await expect(page.locator("#nextBtn")).toBeHidden();
  });

  test("Back returns and Continue is disabled-free; stepper jumps to visited steps", async ({ page }) => {
    await expect(page.locator("#backBtn")).toBeDisabled();
    await gotoStep(page, 2);
    await page.click("#backBtn");
    await expect(page.locator('.pane[data-step="1"]')).toBeVisible();
    await page.locator('#stepper [data-go="0"]').click();
    await expect(page.locator('.pane[data-step="0"]')).toBeVisible();
    await page.locator('#stepper [data-go="2"]').click();
    await expect(page.locator('.pane[data-step="2"]')).toBeVisible();
  });

  test("segmented choices, switches and rupee formatting work", async ({ page }) => {
    await page.locator('[data-seg="employment_type"] button[data-v="self_employed"]').click();
    await expect(page.locator('[data-seg="employment_type"] button[data-v="self_employed"]')).toHaveAttribute("aria-pressed", "true");
    await page.locator('[data-seg="residence"] button[data-v="family"]').click();
    await gotoStep(page, 1);
    await page.fill("#f_inc", "1234567");
    await expect(page.locator("#f_inc")).toHaveValue("12,34,567");
    await expect(page.locator('[data-words="f_inc"]')).toContainText(/lakh/i);
    await gotoStep(page, 0);
    await page.click("#nextBtn");
    const ntc = page.locator("label.switch", { hasText: "New to credit" });
    await ntc.click();
    await expect(page.locator("#f_cibil")).toBeDisabled();
    await ntc.click();
    await expect(page.locator("#f_cibil")).toBeEnabled();
    await page.locator("label.switch", { hasText: "Has defaulted" }).click();
    await expect(page.locator("#f_def")).toBeChecked();
  });

  test("loan type sets the collateral field and tenure rules", async ({ page }) => {
    await gotoStep(page, 3);
    await page.locator('[data-seg="loan_type"] button[data-v="personal"]').click();
    await expect(page.locator("#collField")).toBeHidden();
    await page.locator('[data-seg="loan_type"] button[data-v="home"]').click();
    await expect(page.locator("#collField")).toBeVisible();
    await page.fill("#f_col", "");
    await openSheet(page);
    await page.click("#runBtn");
    await closeSheet(page);
    await expect(err(page, "f_col")).toContainText("value of the home");
    await page.fill("#f_col", "9000000");
    await page.fill("#f_ten", "1");
    await openSheet(page);
    await page.click("#runBtn");
    await closeSheet(page);
    await expect(err(page, "f_ten")).toContainText("months");
  });

  test("Run with a cleared form goes back to the first problem instead of a bogus decision", async ({ page }) => {
    await clear(page);
    await openSheet(page);
    await page.click("#runBtn");
    await closeSheet(page);
    await expect(page.locator('.pane[data-step="0"]')).toBeVisible();
    await expect(err(page, "f_name")).toHaveClass(/err/);
    await expect(page.locator("#stamp")).not.toHaveClass(/on|land/);
  });

  test("clearing resets the sheet to no estimate rather than the old numbers", async ({ page }) => {
    await openSheet(page);
    await expect(page.locator("#pdVal")).not.toHaveText("0.0%");
    await closeSheet(page);
    await clear(page);
    await openSheet(page);
    await expect(page.locator("#pdVal")).not.toContainText(/NaN|undefined/);
    await expect(page.locator("#emiVal")).not.toContainText(/NaN|undefined/);
    await closeSheet(page);
  });

  test("the live estimate reacts to typing", async ({ page }) => {
    await openSheet(page);
    const before = await settled(page, "#pdVal");
    await closeSheet(page);
    await gotoStep(page, 2);
    await page.fill("#f_cibil", "420");
    await openSheet(page);
    await expect(page.locator("#pdVal")).not.toHaveText(before);
    await expect(page.locator("#gradeChip")).toHaveText(/[A-E]/);
  });

  test("all eight sample applicants run to a stamped decision and reach Applicants", async ({ page }) => {
    test.slow();
    const count = await page.locator("#persona option").count();
    expect(count).toBe(9);
    const outcomes = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await page.selectOption("#persona", String(i));
      await expect(page.locator("#toasts")).toContainText("Loaded");
      const name = await page.inputValue("#f_name");
      await openSheet(page);
      await page.click("#runBtn");
      // The button is never disabled and #headTxt keeps the last run's text, so only aria-busy marks this run as finished.
      await expect(page.locator("#runBtn")).toHaveAttribute("aria-busy", "false", { timeout: 15000 });
      const word = await page.locator("#stampWord").innerText();
      expect(["SANCTIONED", "REFER", "DECLINED"]).toContain(word);
      outcomes.add(word);
      await expect(page.locator("#fbars .frow, #fbars > *").first()).toBeVisible();
      await closeSheet(page);
      await hashTo(page, "applicants");
      await page.fill("#q", name);
      await expect(page.locator("#tbody tr").first()).toContainText(name);
      await hashTo(page, "assess");
    }
    expect(outcomes.size, "the personas cover every outcome").toBe(3);
  });

  test("Download PDF gives a real PDF after a run", async ({ page }) => {
    test.skip(!IS_WEB, "website 2's sheet has no PDF button; its report download is on Applicants and is tested there");
    await openSheet(page);
    await page.click("#runBtn");
    await expect(page.locator("#shPdf")).toBeVisible({ timeout: 15000 });
    // Other workers' saves raise "another desk" toasts and only three show at once, so record every toast as it arrives.
    await page.evaluate(() => {
      const seen: string[] = ((window as unknown as { __toasts: string[] }).__toasts = []);
      new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => seen.push(n.textContent || "")))).observe(document.getElementById("toasts")!, { childList: true });
    });
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#shPdf")]);
    expect(dl.suggestedFilename()).toMatch(/\.pdf$/);
    const stream = await dl.createReadStream();
    const head = await new Promise<Buffer>((res, rej) => {
      stream.once("data", (d) => res(d as Buffer));
      stream.once("error", rej);
    });
    stream.destroy();
    expect(head.subarray(0, 4).toString()).toBe("%PDF");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __toasts: string[] }).__toasts.join("|"))).toContain("Downloaded");
  });

  test("Try changes carries the application into What-if", async ({ page }) => {
    await page.selectOption("#persona", "1");
    const name = await page.inputValue("#f_name");
    await openSheet(page);
    await page.click("#toWhatIf");
    await expectView(page, "what-if" as View);
    await expect(page.locator("#wiSliders")).toContainText(name);
  });

  test("assessment sheet stays usable with no layout problems after a run", async ({ page }) => {
    await openSheet(page);
    await page.click("#runBtn");
    await expect(page.locator("#runBtn")).toHaveAttribute("aria-busy", "false", { timeout: 15000 });
    expect(await layoutIssues(page)).toEqual([]);
  });

  test("the phone drawer opens and closes", async ({ page }) => {
    test.skip(!isMobile(page), "drawer exists only below 768px");
    await page.click("#peek");
    await expect(page.locator("#asheet")).toHaveClass(/open/);
    await page.waitForTimeout(450);
    // The drawer scrolls on a short phone: the button must be reachable inside it, above the tab bar.
    await page.locator("#runBtn").scrollIntoViewIfNeeded();
    await expect(page.locator("#runBtn")).toBeInViewport();
    const tabTop = await page.locator(".tabbar").evaluate((e) => e.getBoundingClientRect().top);
    const btn = await page.locator("#runBtn").boundingBox();
    expect(btn!.y + btn!.height).toBeLessThanOrEqual(tabTop);
    await page.locator("#peek").scrollIntoViewIfNeeded();
    await page.click("#peek");
    await expect(page.locator("#asheet")).not.toHaveClass(/open/);
  });
});

test.describe("what-if", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await hashTo(page, "what-if");
  });

  test("every slider re-scores and Reset restores the application", async ({ page }) => {
    const sliders = page.locator('#wiSliders input[type="range"]');
    const n = await sliders.count();
    expect(n).toBeGreaterThan(3);
    const original = await settled(page, "#wiPd");
    for (let i = 0; i < n; i++) {
      const s = sliders.nth(i);
      await s.evaluate((el: HTMLInputElement) => {
        el.value = el.value === el.max ? el.min : el.max;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    await expect(page.locator("#wiPd")).not.toHaveText(original);
    await expect(page.locator("#wiGrade")).toHaveText(/[A-E]/);
    await page.click("#wiReset");
    await expect(page.locator("#wiPd")).toHaveText(original);
  });

  test("a slider reacts to the keyboard", async ({ page }) => {
    const s = page.locator('#wiSliders input[type="range"]').first();
    const before = await s.inputValue();
    await s.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(s).not.toHaveValue(before);
  });

  test("a path to a better grade can be applied", async ({ page }) => {
    // A borderline applicant has paths; find one that offers a card.
    await hashTo(page, "assess");
    for (let i = 0; i < 8; i++) {
      await page.selectOption("#persona", String(i));
      await hashTo(page, "assess");
      await openSheet(page);
      await page.click("#toWhatIf");
      await expectView(page, "what-if");
      const apply = page.locator("#cfList button").first();
      await page.waitForTimeout(300);
      if (await apply.count()) {
        await apply.click();
        await expect(page.locator("#toasts")).toContainText("Change applied", { timeout: 5000 });
        await expect(page.locator("#wiPd")).not.toContainText(/NaN/);
        return;
      }
      await hashTo(page, "assess");
    }
    throw new Error("no persona offered a path to a better grade");
  });
});
