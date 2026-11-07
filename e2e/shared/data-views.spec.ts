import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, goto, signIn, hashTo, expectView, csvTemplateRow, layoutIssues, IS_WEB } from "../lib";
import type { Download, Page } from "@playwright/test";

async function text(dl: Download) {
  const s = await dl.createReadStream();
  const parts: Buffer[] = [];
  for await (const c of s) parts.push(c as Buffer);
  return Buffer.concat(parts).toString("utf8");
}

test.describe("applicants", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await hashTo(page, "applicants");
    await expect(page.locator("#tbody tr").first()).toBeVisible();
    // Website 1 swaps the browser's sample rows (p0, g0...) for the server's records after sign-in, and must redraw when it does.
    if (IS_WEB) await expect(page.locator("#tbody tr").first()).not.toHaveAttribute("data-id", /^[pg]\d+$/, { timeout: 15000 });
  });

  test("search filters and an unmatched search offers the way back", async ({ page }) => {
    await page.fill("#q", "zzzqqq");
    await expect(page.locator("#tbody tr")).toHaveCount(0);
    await expect(page.locator("#tblEmpty")).toContainText('No applicants match "zzzqqq"');
    await page.click('#tblEmpty a[href="#assess"]');
    await expectView(page, "assess");
  });

  test("search text is shown as text, never run as HTML", async ({ page }) => {
    await page.fill("#q", '<img src=x onerror="window.__xss=1">');
    await expect(page.locator("#tblEmpty")).toContainText("<img");
    expect(await page.locator("#tblEmpty img").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test("each outcome filter shows only that outcome", async ({ page }) => {
    for (const [v, label] of [["SANCTIONED", "Sanctioned"], ["REFER", "Refer"], ["DECLINED", "Declined"]]) {
      await page.locator(`#fseg button[data-v="${v}"]`).click();
      const rows = page.locator("#tbody tr");
      await expect(rows.first()).toBeVisible();
      const cells = await rows.locator("td:nth-child(5)").allInnerTexts();
      expect(cells.length).toBeGreaterThan(0);
      for (const c of cells) expect(c.toLowerCase()).toContain(label.toLowerCase().slice(0, 5));
    }
    await page.locator('#fseg button[data-v="ALL"]').click();
    await expect(page.locator("#tbody tr").first()).toBeVisible();
  });

  test("paging moves through results and the buttons disable at the ends", async ({ page }) => {
    await expect(page.locator("#pprev")).toBeDisabled();
    await expect(page.locator("#pinfo")).toContainText("Showing 1 to");
    if (await page.locator("#pnext").isDisabled()) return;
    await page.click("#pnext");
    await expect(page.locator("#pinfo")).toContainText("Showing 13 to");
    await page.click("#pprev");
    await expect(page.locator("#pinfo")).toContainText("Showing 1 to");
  });

  test("a row opens its detail with click and with Enter, and Back returns", async ({ page }) => {
    // Other workers' saves can put a new row on top at any moment, so hold on to one row by its id.
    const id = await page.locator("#tbody tr").first().getAttribute("data-id");
    const row = page.locator(`#tbody tr[data-id="${id}"]`);
    const name = await row.locator(".nm").innerText();
    const grade = (await row.locator("td:nth-child(4)").innerText()).trim();
    const decision = (await row.locator("td:nth-child(5)").innerText()).trim();
    await row.click();
    await expect(page.locator("#appDetail")).toBeVisible();
    await expect(page.locator(".detail-head .nm")).toHaveText(name);
    await expect(page.locator("#detBars > *").first()).toBeVisible();
    expect(await page.locator(".detail-head").innerText(), "detail shows the decision the table showed").toContain(decision);
    expect(await page.locator(".detail-head").innerText()).toContain(grade);
    expect(await layoutIssues(page)).toEqual([]);
    await page.click("#detBack");
    await expect(page.locator("#appList")).toBeVisible();
    await page.locator("#tbody tr").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#appDetail")).toBeVisible();
  });

  test("opening a different row straight after Back does not break the transition", async ({ page }) => {
    const ids = await page.locator("#tbody tr").evaluateAll((rows) => rows.slice(0, 2).map((r) => r.getAttribute("data-id")));
    await page.locator(`#tbody tr[data-id="${ids[0]}"]`).click();
    await expect(page.locator("#appDetail")).toBeVisible();
    await page.click("#detBack");
    await expect(page.locator("#appList")).toBeVisible();
    // Within the 600 ms that the row just closed still holds the transition's name. The guard fixture fails on the resulting error.
    await page.locator(`#tbody tr[data-id="${ids[1]}"]`).click();
    await expect(page.locator("#appDetail")).toBeVisible();
    await expect(page.locator("#detBars > *").first()).toBeVisible();
  });

  test("Download report saves a PDF", async ({ page }) => {
    await page.locator("#tbody tr").first().click();
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#detPdf")]);
    expect(dl.suggestedFilename()).toMatch(/\.pdf$/);
    expect((await text(dl)).slice(0, 4)).toBe("%PDF");
  });

  test("the table scrolls inside its box rather than the page on narrow screens", async ({ page }) => {
    expect(await layoutIssues(page)).toEqual([]);
  });
});

test.describe("batch", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await hashTo(page, "batch");
  });

  async function upload(page: Page, name: string, content: string) {
    await page.setInputFiles("#file", { name, mimeType: "text/csv", buffer: Buffer.from(content) });
  }

  test("template downloads with the expected columns and scores when re-uploaded", async ({ page }) => {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#tplBtn")]);
    expect(dl.suggestedFilename()).toBe("saakh_batch_template.csv");
    const csv = await text(dl);
    expect(csv.split("\n")[0]).toContain("full_name");
    await upload(page, "t.csv", csv);
    await expect(page.locator("#batchOut")).toContainText("1 scored, 0 need fixing", { timeout: 20000 });
  });

  test("the 50-row sample scores with three rows to fix and results download", async ({ page }) => {
    await page.click("#sampleBtn");
    await expect(page.locator("#batchOut")).toContainText("47 scored, 3 need fixing", { timeout: 60000 });
    await expect(page.locator(".errlist li")).toHaveCount(3);
    await expect(page.locator("#batchOut tbody tr")).toHaveCount(10);
    expect(await layoutIssues(page)).toEqual([]);
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 15000 }), page.click("#dlRes")]);
    expect(dl.suggestedFilename()).toBe("saakh_results.csv");
    const lines = (await text(dl)).trim().split("\n");
    expect(lines).toHaveLength(48);
    expect(lines[0]).toContain("grade");
  });

  test("a valid upload is scored", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    await upload(page, "ok.csv", `${header}\n${row}\n${row}\n`);
    await expect(page.locator("#batchOut")).toContainText("2 scored, 0 need fixing", { timeout: 20000 });
  });

  test("a quoted comma stays inside its field and does not shift the other columns", async ({ page }) => {
    // purpose first: splitting on every comma would push all later values one column along and fail validation.
    const { header, row } = csvTemplateRow({ full_name: '"Ananya Rao"', purpose: "" });
    await upload(page, "q.csv", `purpose,${header.replace(",purpose", "")}\n"Tuition, hostel",${row.replace(/,$/, "")}\n`);
    await expect(page.locator("#batchOut")).toContainText("1 scored, 0 need fixing", { timeout: 20000 });
    await expect(page.locator("#batchOut tbody tr").first()).toContainText("Ananya Rao");
  });

  test("a spreadsheet's byte-order mark does not hide the first column", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    await upload(page, "bom.csv", `﻿${header}\n${row}\n`);
    await expect(page.locator("#batchOut")).toContainText("1 scored, 0 need fixing", { timeout: 20000 });
  });

  test("a missing column names what is missing and scores nothing", async ({ page }) => {
    await upload(page, "bad.csv", "full_name,age\nA,30\n");
    await expect(page.locator("#toasts")).toContainText("missing these columns");
    await expect(page.locator("#batchOut")).toBeEmpty();
  });

  test("an empty file or a header with no rows is reported", async ({ page }) => {
    await upload(page, "empty.csv", "");
    await expect(page.locator("#toasts")).toContainText(/missing these columns|empty/i);
    const { header } = csvTemplateRow();
    await upload(page, "head.csv", `${header}\n`);
    await expect(page.locator("#toasts")).toContainText(/no rows|no applications|empty/i);
    await expect(page.locator("#batchOut")).toBeEmpty();
  });

  test("a non-CSV file is refused", async ({ page }) => {
    await page.setInputFiles("#file", { name: "photo.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71, 0, 0]) });
    await expect(page.locator("#toasts")).toContainText(/csv/i);
    await expect(page.locator("#batchOut")).toBeEmpty();
  });

  test("a file over 5 MB is refused", async ({ page }) => {
    const { header } = csvTemplateRow();
    await upload(page, "big.csv", header + "\n" + "x".repeat(5 * 1024 * 1024 + 10));
    await expect(page.locator("#toasts")).toContainText(/5 MB/);
    await expect(page.locator("#batchOut")).toBeEmpty();
  });

  test("more than 5,000 rows is refused rather than silently cut", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    await upload(page, "many.csv", header + "\n" + Array(5001).fill(row).join("\n"));
    await expect(page.locator("#toasts")).toContainText(/5,000/);
    await expect(page.locator("#batchOut")).toBeEmpty();
  });

  test("bad rows are listed with the reason, good rows still score", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    const bad = [
      csvTemplateRow({ age: "12" }).row,
      csvTemplateRow({ monthly_income: "abc" }).row,
      csvTemplateRow({ loan_type: "yacht" }).row,
      csvTemplateRow({ tenure_months: "9999" }).row,
      csvTemplateRow({ cibil_score: "5000" }).row,
      csvTemplateRow({ loan_amount: "-5" }).row,
      csvTemplateRow({ full_name: "" }).row,
    ];
    await upload(page, "mixed.csv", [header, row, ...bad].join("\n"));
    await expect(page.locator("#batchOut")).toContainText("1 scored, 7 need fixing", { timeout: 20000 });
    await expect(page.locator(".errlist")).toContainText("Row 3");
    await expect(page.locator("#batchOut")).not.toContainText(/NaN|undefined/);
  });

  test("a name holding HTML cannot run as a script", async ({ page }) => {
    const { header, row } = csvTemplateRow({ full_name: '<img src=x onerror="window.__xss=1">' });
    await upload(page, "xss.csv", `${header}\n${row}\n`);
    await expect(page.locator("#batchOut h2")).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(200);
    expect(await page.locator("#batchOut img").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test("the same file can be chosen twice in a row", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    await upload(page, "same.csv", `${header}\n${row}\n`);
    await expect(page.locator("#batchOut")).toContainText("1 scored", { timeout: 20000 });
    expect(await page.locator("#file").inputValue(), "input cleared so re-choosing fires change").toBe("");
  });

  test("dropping a file on the drop zone scores it", async ({ page }) => {
    const { header, row } = csvTemplateRow();
    const data = await page.evaluateHandle((csv) => {
      const dt = new DataTransfer();
      dt.items.add(new File([csv], "drop.csv", { type: "text/csv" }));
      return dt;
    }, `${header}\n${row}\n`);
    await page.dispatchEvent("#drop", "dragover", { dataTransfer: data });
    await expect(page.locator("#drop")).toHaveClass(/over/);
    await page.dispatchEvent("#drop", "drop", { dataTransfer: data });
    await expect(page.locator("#batchOut")).toContainText("1 scored", { timeout: 20000 });
  });

  test("Choose file label opens the file picker", async ({ page }) => {
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('label[for="file"]')]);
    expect(chooser.isMultiple()).toBe(false);
  });
});

test.describe("portfolio", () => {
  test("shows KPIs and draws all four charts", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "portfolio");
    await expect(page.locator("#kpis > *").first()).toBeVisible();
    await expect(page.locator("#kpis")).not.toContainText(/NaN|undefined/);
    for (const id of ["chGrade", "chHist", "chType", "chScatter"]) {
      await expect.poll(() => page.locator(`#${id} > *`).count(), id).toBeGreaterThan(3);
    }
    await expect(page.locator(".charts svg text").first()).toBeAttached();
    expect(await layoutIssues(page)).toEqual([]);
  });

  test("new assessments are reflected", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "portfolio");
    await expect(page.locator("#kpis > *").first()).toBeVisible();
    const first = await page.locator("#kpis").innerText();
    await hashTo(page, "assess");
    await page.selectOption("#persona", "2");
    if ((page.viewportSize()?.width ?? 1440) < 768) await page.click("#peek");
    await page.click("#runBtn");
    await expect(page.locator("#headTxt")).not.toBeEmpty({ timeout: 15000 });
    await hashTo(page, "portfolio");
    await expect.poll(() => page.locator("#kpis").innerText()).not.toBe(first);
  });
});

test.describe("model", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "model");
  });

  test("all four tabs show their panel", async ({ page }) => {
    for (const [t, sel] of [["perf", "#chRoc"], ["imp", "#chImp"], ["card", ".mc"], ["pipe", "#pipe"]]) {
      await page.locator(`#mtabs [data-t="${t}"]`).click();
      await expect(page.locator(`#mtabs [data-t="${t}"]`)).toHaveAttribute("aria-selected", "true");
      await expect(page.locator(`.tabpanel[data-p="${t}"]`)).toBeVisible();
      await expect(page.locator(sel)).toBeVisible();
    }
    await page.locator('#mtabs [data-t="perf"]').click();
    await expect.poll(() => page.locator("#chRoc > *").count()).toBeGreaterThan(3);
    await expect(page.locator(".view.on .tabpanel.on")).not.toContainText(/NaN|undefined/);
    await expect(page.locator("#cm")).not.toBeEmpty();
    expect(await layoutIssues(page)).toEqual([]);
    await page.locator('#mtabs [data-t="imp"]').click();
    await expect.poll(() => page.locator("#chImp > *").count()).toBeGreaterThan(3);
  });

  test("tabs work from the keyboard", async ({ page }) => {
    await page.locator('#mtabs [data-t="pipe"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('#mtabs [data-t="perf"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('#mtabs [data-t="perf"]')).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator('#mtabs [data-t="pipe"]')).toHaveAttribute("aria-selected", "true");
  });

  test("clicking or pressing Enter on a stage opens its inspector", async ({ page }) => {
    test.skip(!IS_WEB, "website 2's pipeline stages are static cards with no inspector");
    await expect(page.locator("#pipeInspector")).toBeVisible();
    const nodes = page.locator(".pnode");
    const n = await nodes.count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < n; i++) {
      await nodes.nth(i).click();
      await expect(nodes.nth(i)).toHaveClass(/hot/);
      await expect(page.locator("#pipeInspector")).not.toContainText(/NaN|undefined/);
    }
    await nodes.nth(0).focus();
    await page.keyboard.press("Enter");
    await expect(nodes.nth(0)).toHaveClass(/hot/);
  });

  test("choosing a person and tracing walks every stage", async ({ page }) => {
    test.slow();
    if (IS_WEB) {
      await page.selectOption("#tracePersona", "3");
      await expect(page.locator("#traceSub")).toContainText("Tracing");
    }
    await page.click("#traceBtn");
    await expect(page.locator("#traceBtn")).toBeDisabled();
    await expect(page.locator("#toasts")).not.toBeEmpty({ timeout: 20000 });
    await expect(page.locator("#traceBtn")).toBeEnabled();
  });
});

test.describe("tutorials", () => {
  const data = JSON.parse(readFileSync(resolve(__dirname, "../../apps/web/components/tutorial/topics.json"), "utf8"));

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await hashTo(page, "tutorials");
  });

  test("the full guide video is reachable and loads", async ({ page, request }) => {
    const v = page.locator(".tut-full video");
    await expect(v).toBeVisible();
    const src = await v.evaluate((e: HTMLVideoElement) => e.src);
    const poster = await v.evaluate((e: HTMLVideoElement) => e.poster);
    expect((await request.head(src)).status()).toBe(200);
    expect((await request.head(poster)).status()).toBe(200);
    await v.evaluate((e: HTMLVideoElement) => { e.preload = "metadata"; e.load(); });
    await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.readyState), { timeout: 20000 }).toBeGreaterThan(0);
  });

  test("every topic's clip exists", async ({ page, request }) => {
    const base = await page.evaluate(() => location.href);
    const origin = new URL(base);
    const prefix = origin.pathname.includes("/saakh") ? "/saakh" : "";
    const srcs = data.chapters.flatMap((c: { topics: { src: string }[] }) => c.topics.map((t) => t.src));
    expect(srcs.length).toBe(44);
    for (const s of srcs) expect((await request.head(`${origin.origin}${prefix}${s}`)).status(), s).toBe(200);
  });

  test("a topic opens, plays its clip, closes, and only one stays open", async ({ page }) => {
    const toggles = page.locator(".tut-toggle");
    await toggles.nth(0).click();
    await expect(toggles.nth(0)).toHaveAttribute("aria-expanded", "true");
    const v = page.locator(".tut-topic.open video");
    await expect(v).toBeVisible();
    await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.readyState), { timeout: 20000 }).toBeGreaterThan(0);
    await expect(page.locator(".tut-topic.open .tut-desc")).not.toBeEmpty();
    await toggles.nth(1).click();
    await expect(page.locator(".tut-topic.open")).toHaveCount(1);
    await expect(toggles.nth(0)).toHaveAttribute("aria-expanded", "false");
    await toggles.nth(1).click();
    await expect(page.locator(".tut-topic.open")).toHaveCount(0);
    expect(await layoutIssues(page)).toEqual([]);
  });

  test("search narrows topics and an unmatched search says so", async ({ page }) => {
    const all = await page.locator(".tut-topic").count();
    await page.fill("#tutSearch", "PDF");
    await expect.poll(() => page.locator(".tut-topic").count()).toBeLessThan(all);
    await expect(page.locator(".tut-topic").first()).toBeVisible();
    await page.fill("#tutSearch", "zzzzqqq");
    await expect(page.locator(".tut-list")).toContainText(/No (topics|tutorials) match/);
    await page.fill("#tutSearch", "");
    await expect(page.locator(".tut-topic")).toHaveCount(all);
  });

  test("written guidance does not contradict the sign-in the site requires", async ({ page }) => {
    await page.fill("#tutSearch", "getting started");
    await page.locator(".tut-toggle").first().click();
    await expect(page.locator(".tut-topic.open .tut-desc")).not.toContainText(/no sign up|no password/i);
  });

  test("leaving the page pauses a playing video", async ({ page }) => {
    await page.locator(".tut-toggle").first().click();
    const v = page.locator(".tut-topic.open video");
    await v.evaluate(async (e: HTMLVideoElement) => { e.muted = true; await e.play().catch(() => {}); });
    await hashTo(page, "about");
    expect(await page.evaluate(() => (document.querySelector(".tut-topic.open video") as HTMLVideoElement).paused)).toBe(true);
  });
});

test.describe("about", () => {
  test("lists the project facts and starts the demo", async ({ page }) => {
    await goto(page, "about");
    await expect(page.locator(".view.on")).toContainText("NITHIN KUMAR U".replace("NITHIN KUMAR U", "Nithin Kumar U"));
    await expect(page.locator(".view.on")).toContainText("2102508611");
    await page.click("#aboutTour");
    await expect(page.locator("#tour")).toBeVisible();
  });
});

test("focus can reach the main controls with the keyboard", async ({ page }) => {
  await goto(page, "login");
  await page.focus("#fa_email");
  await page.keyboard.press("Tab");
  await expect(page.locator("#fa_pw")).toBeFocused();
});

test("no external resource fails to load on the home page", async ({ page }) => {
  await goto(page, "home");
  await page.waitForLoadState("networkidle").catch(() => {});
  await expectView(page, "home");
});
