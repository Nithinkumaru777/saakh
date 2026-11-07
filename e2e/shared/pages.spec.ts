import { test, expect, goto, signIn, hashTo, layoutIssues, unclickable, VIEWS, PUBLIC_VIEWS, H1, IS_WEB, type View } from "../lib";

const PROTECTED = VIEWS.filter((v) => !PUBLIC_VIEWS.includes(v));

async function openLoaded(page: import("@playwright/test").Page, view: View) {
  if (PUBLIC_VIEWS.includes(view)) {
    await goto(page, view);
    return;
  }
  await signIn(page);
  await hashTo(page, view);
}

for (const view of VIEWS) {
  test.describe(`page: ${view}`, () => {
    test("loads with its heading and no blank sections", async ({ page }) => {
      await openLoaded(page, view);
      await expect(page.locator(".view.on h1:visible")).toHaveCount(1);
      await expect(page.locator(".view.on h1")).toHaveText(H1[view]);
      await page.waitForTimeout(400);
      const blank = await page.evaluate(() => {
        const empty: string[] = [];
        document.querySelectorAll(".view.on section, .view.on .panel, .view.on .sheet").forEach((s) => {
          const el = s as HTMLElement;
          if (!el.offsetHeight || el.closest("[hidden]") || el.id === "pipeInspector") return;
          if (!el.innerText.trim() && !el.querySelector("svg,video,img,canvas")) empty.push(el.className || el.tagName);
        });
        return empty;
      });
      expect(blank).toEqual([]);
    });

    test("has no overflow, cut-off or overlapping content", async ({ page }) => {
      await openLoaded(page, view);
      expect(await layoutIssues(page)).toEqual([]);
    });

    test("every control can be clicked", async ({ page }) => {
      await openLoaded(page, view);
      await page.waitForTimeout(300);
      expect(await unclickable(page)).toEqual([]);
    });

    test("SEO basics", async ({ page }) => {
      await openLoaded(page, view);
      await expect(page).toHaveTitle(/Saakh/);
      const title = await page.title();
      expect(title.length, "title length").toBeGreaterThan(9);
      if (view !== "home") expect(title, "each page has its own title").toContain(view === "login" ? "Sign in" : H1[view]);
      const meta = (sel: string) => page.locator(sel).first().getAttribute("content", { timeout: 2000 }).catch(() => null);
      const desc = await meta('meta[name="description"]');
      expect(desc?.length || 0, "meta description").toBeGreaterThan(50);
      expect(await meta('meta[property="og:title"]'), "og:title").toBeTruthy();
      expect(await meta('meta[property="og:description"]'), "og:description").toBeTruthy();
      expect(await meta('meta[property="og:type"]'), "og:type").toBeTruthy();
      expect(await meta('meta[property="og:image"]'), "og:image").toBeTruthy();
      const noAlt = await page.locator("img:not([alt])").count();
      expect(noAlt, "images without alt").toBe(0);
      const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src));
      expect(broken).toEqual([]);
      const icons = await page.locator('link[rel~="icon"]').evaluateAll((l) => l.map((x) => (x as HTMLLinkElement).href).filter((h) => !h.startsWith("data:")));
      expect(icons.length, "favicon link").toBeGreaterThan(0);
      for (const href of icons) expect((await page.request.get(href)).status(), href).toBe(200);
    });
  });
}

test.describe("access control", () => {
  for (const view of PROTECTED) {
    test(`${view} sends a signed-out visitor to sign in, then back`, async ({ page }) => {
      await page.goto(IS_WEB ? `/${view}` : `./#${view}`);
      await expect(page.locator('.view[data-view="login"].on')).toBeVisible();
      await page.locator('#authSeg button[data-v="register"]').click();
      await page.fill("#fa_name", "Return Tester");
      await page.fill("#fa_email", `return.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`);
      await page.fill("#fa_pw", "Audit2026pass");
      await page.click("#authSubmit");
      await expect(page.locator(`.view[data-view="${view}"].on`)).toBeVisible();
    });
  }
});

test("reloading on a page after signing in keeps the session and the page", async ({ page }) => {
  await signIn(page);
  await hashTo(page, "portfolio");
  await page.reload();
  await expect(page.locator('.view[data-view="portfolio"].on')).toBeVisible();
  await expect(page.locator("#kpis")).not.toBeEmpty();
});

test("an unknown hash falls back to a real page", async ({ page }) => {
  await page.goto(IS_WEB ? "/#does-not-exist" : "./#does-not-exist");
  await expect(page.locator('.view[data-view="home"].on')).toBeVisible();
});
