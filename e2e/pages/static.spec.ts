// Website 2 only: the static GitHub Pages build has no server and must behave on its own.
import { test, expect, goto, signIn, hashTo, expectView, openSheet, PASSWORD, VIEWS, PUBLIC_VIEWS } from "../lib";

test("never calls a backend on localhost from the deployed page", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => { if (/localhost:8000|127\.0\.0\.1:8000/.test(r.url())) calls.push(r.url()); });
  await goto(page, "home");
  await page.fill("#sCib", "500");
  await signIn(page);
  await page.waitForTimeout(500);
  expect(calls).toEqual([]);
});

test("works when the visitor is offline after loading", async ({ page, context }) => {
  await signIn(page);
  await context.setOffline(true);
  await page.selectOption("#persona", "0");
  await openSheet(page);
  await page.click("#runBtn");
  await expect(page.locator("#headTxt")).not.toBeEmpty({ timeout: 15000 });
  await context.setOffline(false);
});

test("the page opened at the bare /saakh path redirects and loads", async ({ page, baseURL }) => {
  await page.goto(baseURL!.replace(/\/$/, ""));
  await expectView(page, "home");
});

test("a run on this device stays after a reload", async ({ page }) => {
  await signIn(page);
  await page.fill("#f_name", "Local Keeper");
  await openSheet(page);
  await page.click("#runBtn");
  await expect(page.locator("#headTxt")).not.toBeEmpty({ timeout: 15000 });
  await page.reload();
  await hashTo(page, "applicants");
  await page.fill("#q", "Local Keeper");
  await expect(page.locator("#tbody tr").first()).toContainText("Local Keeper");
});

test("passwords are not stored in readable form", async ({ page }) => {
  await signIn(page);
  const stored = await page.evaluate(() => localStorage.getItem("saakh_users") || "");
  expect(stored).not.toContain(PASSWORD);
});

test("a stored account from before password hashing still signs in, and is upgraded", async ({ page }) => {
  await goto(page, "login");
  await page.evaluate(() => localStorage.setItem("saakh_users", JSON.stringify([{ id: "u-old", email: "old@example.com", full_name: "Old User", password: "OldPass123", created_at: "2026-01-01T00:00:00Z" }])));
  await page.fill("#fa_email", "old@example.com");
  await page.fill("#fa_pw", "OldPass123");
  await page.click("#authSubmit");
  await expectView(page, "assess");
  expect(await page.evaluate(() => localStorage.getItem("saakh_users"))).not.toContain("OldPass123");
});

for (const view of VIEWS.filter((v) => PUBLIC_VIEWS.includes(v))) {
  test(`opening #${view} directly works`, async ({ page }) => {
    await page.goto(`./#${view}`);
    await expectView(page, view);
  });
}
