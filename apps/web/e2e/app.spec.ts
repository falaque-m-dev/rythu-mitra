import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII=",
  "base64"
);

test("home shows the farming dashboard and exposes only real sections", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Smart solutions for smart farmers/i })).toBeVisible();

  const primaryNav = page.getByRole("navigation", { name: "Primary" });
  await expect(primaryNav.getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Expo", exact: true })).toHaveCount(0);
});

test("floating AI advisor opens in a modal without leaving the page", async ({ page }) => {
  await page.goto("/");

  const floatingButton = page.getByRole("button", { name: "Open AI Advisor" });
  await expect(floatingButton).toBeVisible();
  await floatingButton.click({ force: true, position: { x: 8, y: 8 } });

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Type your question")).toBeVisible();
  await expect(dialog.getByText("Your farm expert, one tap away.")).toBeVisible();
});

test("weather shows a seven-day forecast", async ({ page }) => {
  await page.goto("/weather");

  await expect(page.getByRole("heading", { name: "7-day forecast" })).toBeVisible();
  await expect(page.getByTestId("forecast-day")).toHaveCount(7);
  await expect(page.locator('#region optgroup[label="Telangana"]')).toHaveCount(1);
  await expect(page.locator("#region option")).toHaveCount(10);
  await expect(page.locator("#region option").filter({ hasText: /Andhra Pradesh/ })).toHaveCount(0);
  await expect(page.getByTestId("forecast-day")).toHaveCount(7);
});

test("crop diagnosis refuses to invent a result without a model key", async ({ page }) => {
  await page.goto("/doctor");

  await page.locator('input[type="file"]').setInputFiles({
    name: "leaf.png",
    mimeType: "image/png",
    buffer: onePixelPng
  });

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("main").getByText(/Crop diagnosis is not configured/)).toBeVisible();
  await expect(page.getByRole("main").getByText("Early blight")).toHaveCount(0);
});

test("mandi shows the market page", async ({ page }) => {
  await page.goto("/mandi");

  await expect(page.getByRole("heading", { name: "Mandi Prices" })).toBeVisible();
});

test("advisor labels local knowledge instead of claiming a live model", async ({ page }) => {
  await page.goto("/advisor");

  await page.getByLabel("Type your question").fill("How much urea for paddy?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(/For 1 acre of Paddy/)).toBeVisible();
  await expect(page.getByText("Local knowledge")).toBeVisible();
  await expect(page.getByText("Live AI")).toHaveCount(0);
});


