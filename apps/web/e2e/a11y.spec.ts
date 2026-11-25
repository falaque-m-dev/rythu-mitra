import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/doctor", "/advisor", "/weather", "/mandi"]) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) =>
        (violation.impact === "serious" || violation.impact === "critical") &&
        violation.id !== "color-contrast" &&
        violation.id !== "label-content-name-mismatch"
    );

    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")
    ).toEqual([]);
  });
}
