import { expect, test, type Browser, type Page } from "@playwright/test";

const password = "Salonomia-Local-Only-1!";
const loginIps: Record<string, string> = {
  "superadmin@salonomia.local": "203.0.113.31",
  "salonadmin@salonomia.local": "203.0.113.32",
  "salonmanager@salonomia.local": "203.0.113.33",
};

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

function nextBookableDate(offsetDays = 5) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  while (date.getUTCDay() === 0) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function login(page: Page, email: string) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": loginIps[email] ?? "203.0.113.240" });
  await page.goto("/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə").fill(password);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 30_000 });
}

async function loggedInPage(browser: Browser, email: string, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

test.describe("all protected panel pages", () => {
  test("super admin pages open and salon status action round-trips", async ({ browser }) => {
    test.skip(test.info().project.name !== "chromium-desktop", "panel route matrix runs once on desktop");
    const { context, page } = await loggedInPage(browser, "superadmin@salonomia.local");
    await expect(page).toHaveURL(/\/superadmin/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Salonlar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const row = page.getByRole("row").filter({ hasText: "Glow Makeup Studio" });
    await row.getByRole("link", { name: "Detallara bax" }).click();
    await expect(page.getByRole("heading", { name: "Glow Makeup Studio" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Audit fəaliyyəti" })).toBeVisible();

    page.once("dialog", async (dialog) => dialog.accept());
    const firstAction = page.getByRole("button", { name: /Dayandır|Aktiv et/ });
    const firstLabel = await firstAction.textContent();
    await firstAction.click();
    await expect(page.getByRole("button", { name: firstLabel?.includes("Dayandır") ? "Aktiv et" : "Dayandır" })).toBeVisible({ timeout: 15_000 });

    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: firstLabel?.includes("Dayandır") ? "Aktiv et" : "Dayandır" }).click();
    await expect(page.getByRole("heading", { name: "Glow Makeup Studio" })).toBeVisible();
    await context.close();
  });

  test("salon admin pages open and catalog workflows work", async ({ browser }) => {
    test.skip(test.info().project.name !== "chromium-desktop", "catalog mutation flow runs once");
    test.setTimeout(90_000);
    const stamp = Date.now();
    const serviceName = `E2E xidmət ${stamp}`;
    const editedServiceName = `E2E xidmət redaktə ${stamp}`;
    const providerName = `E2E usta ${stamp}`;
    const editedProviderName = `E2E usta redaktə ${stamp}`;
    const { context, page } = await loggedInPage(browser, "salonadmin@salonomia.local");

    for (const [url, heading] of [
      ["/salonadmin", "Lilac Beauty Studio"],
      ["/salonadmin/appointments", "Rezervasiyalar"],
      ["/salonadmin/services", "Xidmətlər"],
      ["/salonadmin/team", "Komanda"],
      ["/salonadmin/hours", "İş saatları"],
    ] as const) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await page.goto("/salonadmin/services");
    await page.getByText("Yeni xidmət əlavə et").click();
    await page.getByLabel("Xidmət adı").fill(serviceName);
    await page.getByLabel("Qiymət (qəpik)").fill("5100");
    await page.getByLabel("Müddət (dəqiqə)").fill("45");
    await page.getByLabel("Buffer (dəqiqə)").fill("10");
    const serviceCreate = page.waitForResponse((response) => response.url().endsWith("/api/salon/catalog") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Xidməti əlavə et" }).click();
    expect((await serviceCreate).ok()).toBe(true);
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 15_000 });

    const serviceCard = page.locator("article.catalog-item").filter({ hasText: serviceName });
    await serviceCard.getByRole("button", { name: `${serviceName} redaktə et` }).click();
    const serviceDialog = page.getByRole("dialog", { name: "Xidmət məlumatı" });
    await serviceDialog.getByLabel("Xidmət adı").fill(editedServiceName);
    await serviceDialog.getByRole("button", { name: "Dəyişiklikləri yadda saxla" }).click();
    await expect(page.getByText(editedServiceName)).toBeVisible({ timeout: 15_000 });
    const editedServiceCard = page.locator("article.catalog-item").filter({ hasText: editedServiceName });
    await editedServiceCard.getByRole("button", { name: /Gizlət/ }).click();
    await expect(page.getByText("Dəyişiklik yadda saxlanıldı.")).toBeVisible();

    await page.goto("/salonadmin/team");
    await page.getByText("Yeni usta əlavə et").click();
    await page.getByLabel("Ad, soyad").fill(providerName);
    await page.getByLabel("İxtisaslaşma").fill("E2E test profili");
    const providerCreate = page.waitForResponse((response) => response.url().endsWith("/api/salon/catalog") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Ustanı əlavə et" }).click();
    expect((await providerCreate).ok()).toBe(true);
    await expect(page.getByText(providerName)).toBeVisible({ timeout: 15_000 });
    const providerCard = page.locator("article.team-card").filter({ hasText: providerName });
    await providerCard.getByRole("button", { name: "Redaktə et" }).click();
    const teamDialog = page.getByRole("dialog", { name: "Usta məlumatı" });
    await teamDialog.getByLabel("Ad, soyad").fill(editedProviderName);
    await teamDialog.getByRole("button", { name: "Dəyişiklikləri yadda saxla" }).click();
    await expect(page.getByText(editedProviderName)).toBeVisible({ timeout: 15_000 });

    await page.goto("/salonadmin/hours");
    await page.getByRole("button", { name: "Yadda saxla" }).first().click();
    await expect(page.getByText("Dəyişiklik yadda saxlanıldı.")).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("manager pages open and walk-in creates a booking", async ({ browser }) => {
    test.skip(test.info().project.name !== "mobile-375", "manager operational flow is mobile-first");
    const { context, page } = await loggedInPage(browser, "salonmanager@salonomia.local", { width: 375, height: 812 });
    await expect(page).toHaveURL(/\/salonmanager/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Təqvim" })).toBeVisible();
    await page.goto("/salonadmin/appointments");
    await expect(page.getByRole("heading", { name: "Rezervasiyalar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/salonmanager");
    await page.getByRole("button", { name: /Walk-in əlavə et/ }).first().click();
    await page.getByLabel("Ad, soyad").fill(`Manager E2E ${Date.now()}`);
    await page.getByLabel("Telefon").fill("+994501119988");
    await page.getByLabel("E-poçt").fill(`manager-e2e-${Date.now()}@example.com`);
    await page.getByLabel("Xidmət").selectOption({ index: 1 });
    await page.getByLabel("Usta").selectOption({ index: 1 });
    const walkInDialog = page.getByRole("dialog", { name: "Walk-in əlavə et" });
    await walkInDialog.getByLabel("Tarix").fill(nextBookableDate());
    await expect(walkInDialog.getByText("Real availability slotlarından birini seçin.")).toBeVisible({ timeout: 15_000 });
    await walkInDialog.locator(".slot-pill").first().click();
    await page.getByRole("button", { name: "Walk-in yarat" }).click();
    await expect(page.getByText(/Walk-in rezervasiyası yaradıldı:/)).toBeVisible({ timeout: 15_000 });
    await context.close();
  });
});
