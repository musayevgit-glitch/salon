import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const password = "Salonomia-Local-Only-1!";
const salonSlug = "velvet-nail-bar";
const serviceId = "cm00000000000000000000010";
const providerId = "cm000000000000000000000200";
const loginIps: Record<string, string> = {
  "superadmin@salonomia.local": "203.0.113.11",
  "salonadmin@salonomia.local": "203.0.113.12",
  "salonmanager@salonomia.local": "203.0.113.13",
  "customer@salonomia.local": "203.0.113.14",
};

function nextBookableDate(offset = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  while (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNoCriticalA11yViolations(page: Page) {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    const axe = (window as typeof window & { axe: { run: (node?: Element | Document) => Promise<{ violations: Array<{ id: string; impact: string | null; nodes: unknown[] }> }> } }).axe;
    return axe.run(document);
  });
  const serious = results.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

async function login(page: Page, email: string) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": loginIps[email] ?? "203.0.113.250" });
  await page.goto("/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə").fill(password);
  await page.getByRole("button", { name: "Daxil ol" }).click();
}

test.describe("public mobile and booking flow", () => {
  test("landing, salon profile and booking page are responsive and accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "salonomia" })).toBeVisible();
    if (test.info().project.name.startsWith("mobile-")) {
      await page.getByRole("button", { name: "Menyunu aç" }).click();
      await expect(page.getByRole("dialog", { name: "Mobil menyu" }).getByRole("link", { name: /Daxil ol/ })).toBeVisible();
      await page.getByRole("button", { name: "Menyunu bağla" }).click();
    } else {
      await expect(page.getByRole("link", { name: /Daxil ol/ })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
    await expectNoCriticalA11yViolations(page);

    await page.goto(`/salons/${salonSlug}`);
    await expect(page.getByRole("heading", { name: "Velvet Nail Bar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Seç" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/salons/${salonSlug}/book`));
    await expect(page.getByRole("heading", { name: "Rezervasiya et" })).toBeVisible();
    await page.getByRole("button", { name: "Davam et" }).click();
    await expect(page.getByRole("heading", { name: "Tarix və saat seçin" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("availability endpoint feeds real booking slots and token management UI", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-375", "booking manage flow is exercised once on the primary mobile viewport");
    const date = nextBookableDate(2);
    const availability = await page.request.get(`/api/availability?providerId=${providerId}&serviceId=${serviceId}&date=${date}`);
    expect(availability.ok()).toBeTruthy();
    const body = await availability.json() as { slots?: string[] };
    expect(body.slots?.length ?? 0).toBeGreaterThan(0);

    await page.goto(`/salons/${salonSlug}/book?service=${serviceId}`);
    await page.getByRole("button", { name: "Davam et" }).click();
    await page.getByLabel("Tarix").fill(date);
    await expect(page.locator(".shot-times button").first()).toBeVisible();
    await page.locator(".shot-times button").first().click();
    await page.getByRole("button", { name: "Davam et" }).click();
    await page.getByLabel("Ad və soyad").fill(`E2E Customer ${Date.now()}`);
    await page.getByLabel("E-poçt").fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel("Telefon").fill("+994501112233");
    await page.getByRole("button", { name: "Rezervasiyanı yarat" }).click();
    await expect(page).toHaveURL(/\/confirm\/.+token=/);
    await expect(page.getByRole("heading", { name: /Rezervasiya #/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rezervasiyanızı idarə edin" })).toBeVisible();

    await page.getByRole("button", { name: "Vaxtı dəyiş" }).click();
    await expect(page.getByRole("dialog", { name: "Rezervasiyanı dəyiş" })).toBeVisible();
    await page.getByLabel("Yeni tarix").fill(nextBookableDate(4));
    await expect(page.locator(".reschedule-slots .slot").first()).toBeVisible();
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.getByRole("button", { name: "İmtina et" }).click();

    await page.getByRole("button", { name: "Rezervasiyanı ləğv et" }).click();
    await expect(page.getByRole("dialog", { name: "Rezervasiyanı ləğv edirsiniz?" })).toBeVisible();
    await page.getByRole("button", { name: "Bəli, ləğv et" }).click();
    await expect(page.getByText("Rezervasiyanız ləğv edildi.")).toBeVisible();
  });
});

test.describe("role routes and admin mobile operations", () => {
  test("unauthenticated admin routes redirect to login", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium-desktop", "route guard redirects are project-independent");
    await page.goto("/superadmin");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/salonadmin");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/salonmanager");
    await expect(page).toHaveURL(/\/login/);
  });

  test("role based redirects land on the correct portals", async ({ browser }) => {
    test.skip(test.info().project.name !== "chromium-desktop", "auth rate limit keeps full role matrix to one project");
    const cases = [
      ["superadmin@salonomia.local", /\/superadmin/],
      ["salonadmin@salonomia.local", /\/salonadmin/],
      ["salonmanager@salonomia.local", /\/salonmanager/],
      ["customer@salonomia.local", /\/$/],
    ] as const;
    for (const [email, url] of cases) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, email);
      await expect(page).toHaveURL(url, { timeout: 30_000 });
      await context.close();
    }
  });

  test("manager calendar exposes mobile card agenda and walk-in dialog", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-375", "manager mobile agenda is checked on the primary phone viewport");
    await login(page, "salonmanager@salonomia.local");
    await expect(page).toHaveURL(/\/salonmanager/);
    await expect(page.getByRole("heading", { name: "Təqvim" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: /Walk-in əlavə et/ }).first().click();
    await expect(page.getByRole("dialog", { name: "Walk-in əlavə et" })).toBeVisible();
    await expect(page.getByLabel("Ad, soyad")).toBeVisible();
  });

  test("salon admin and super admin tables remain usable as mobile cards", async ({ browser }) => {
    test.skip(test.info().project.name !== "mobile-375", "admin card layout is checked on the primary phone viewport");
    const adminContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const adminPage = await adminContext.newPage();
    await login(adminPage, "salonadmin@salonomia.local");
    await expect(adminPage).toHaveURL(/\/salonadmin/);
    await expect(adminPage.getByRole("navigation")).toBeVisible();
    await adminPage.goto("/salonadmin/appointments");
    await expectNoHorizontalOverflow(adminPage);
    await expect(adminPage.locator("td[data-label='Müştəri']").first()).toBeVisible();
    await adminContext.close();

    const superContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const superPage = await superContext.newPage();
    await login(superPage, "superadmin@salonomia.local");
    await expect(superPage).toHaveURL(/\/superadmin/);
    await expectNoHorizontalOverflow(superPage);
    await expect(superPage.locator("td[data-label='Salon']").first()).toBeVisible();
    await superContext.close();
  });
});
