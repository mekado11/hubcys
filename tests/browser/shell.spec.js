import { test, expect } from "@playwright/test";
const start = "/review.html#/app/overview";
const evidence = "/review.html#/app/readiness/exercise-1?org=org-a";
async function navigate(page, title) {
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: title, exact: true })
    .click();
}
test("six primary sections remain usable at the project viewport", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(start);
  for (const [title, heading] of [
    ["Overview", "Organization readiness"],
    ["Readiness", "Readiness profiles"],
    ["Exercises", "Exercises"],
    ["Remediation", "Remediation"],
    ["Threats", "Threats"],
    ["Reporting", "Reporting"],
  ]) {
    await navigate(page, title);
    await expect(
      page.getByRole("heading", { level: 1, name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .isVisible()
    )
      await expect(page.locator(".v2-sidebar")).toBeHidden();
  }
  expect(errors).toEqual([]);
});
test("threat and exercise filters lead to explainable evidence", async ({
  page,
}) => {
  await page.goto(start);
  await navigate(page, "Readiness");
  await page.getByLabel("Threat profile").selectOption("cloud_compromise");
  await expect(page.locator(".v2-exercise-row")).toHaveCount(1);
  await page.getByLabel("Threat profile").selectOption("all");
  await page
    .getByRole("textbox", { name: "Filter exercises" })
    .fill("unmatched");
  await expect(
    page.getByRole("heading", { name: "No matching exercises" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Filter exercises" }).fill("");
  await page.getByRole("link", { name: "View evidence", exact: true }).click();
  await expect(page.locator(".v2-score strong")).toHaveText("56");
  await page.getByRole("button", { name: "Escalation 100" }).click();
  await expect(page.locator(".v2-score strong")).toHaveText("100");
  await page.getByRole("button", { name: "Evidence Preservation 56" }).click();
  await page
    .getByRole("button", { name: /Acquire forensic evidence before reimaging/ })
    .click();
  await expect(
    page
      .locator("#detail-criterion-2")
      .getByText(
        "We reimaged the affected endpoint to restore service. The disk image was not acquired before reimaging.",
      ),
  ).toBeVisible();
  await page
    .getByText("Integrity and provenance", { exact: true })
    .first()
    .click();
  await expect(
    page.locator("#detail-criterion-2").getByText("SHA-256", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("How this result is calculated", { exact: true })
    .click();
  await expect(page.getByText("6 earned / 10 planned weight")).toHaveCount(0); // Scope is the selected capability, not the overall exercise.
  await expect(page.getByText("5 earned / 9 planned weight")).toBeVisible();
  await expect(page.getByText("ACT-021", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Ready For Verification", { exact: true }),
  ).toBeVisible();
});
test("changing organizations clears the evidence view and preserves the chosen scope", async ({
  page,
}) => {
  await page.goto(evidence);
  await expect(page.locator(".v2-score strong")).toHaveText("56");
  await page
    .getByRole("combobox", { name: "Organization", exact: true })
    .selectOption("org-empty");
  await expect(
    page.getByRole("heading", { name: "No exercises in this view" }),
  ).toBeVisible();
  await expect(page.getByText("FND-014", { exact: true })).toHaveCount(0);
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page.getByRole("link", { name: "HubCyS overview" }).click();
  await expect(
    page.getByRole("combobox", { name: "Organization", exact: true }),
  ).toHaveValue("org-empty");
  await page
    .getByRole("combobox", { name: "Organization", exact: true })
    .selectOption("org-a");
  await expect(
    page.getByRole("link", { name: "Open evidence chain" }),
  ).toBeVisible();
});
test("empty, no-membership and unavailable states do not substitute scores", async ({
  page,
}) => {
  await page.goto(start);
  await page.getByLabel("Interface review state").selectOption("empty");
  await expect(
    page.getByRole("heading", { name: "No exercises in this view" }),
  ).toBeVisible();
  await page.getByLabel("Interface review state").selectOption("unassigned");
  await expect(
    page.getByRole("heading", { name: "No V2 organization assigned" }),
  ).toBeVisible();
  await page.getByLabel("Interface review state").selectOption("unavailable");
  await expect(page.getByRole("alert")).toContainText(
    "Synthetic unavailable-service state",
  );
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Interface review state").selectOption("populated");
  await expect(
    page.getByRole("heading", { level: 1, name: "Organization readiness" }),
  ).toBeVisible();
});
test("restricted and tampered evidence states withhold sensitive or unverifiable content", async ({
  page,
}) => {
  await page.goto(evidence);
  await page.getByLabel("Interface review state").selectOption("restricted");
  await expect(
    page.getByRole("heading", { name: "Access restricted" }),
  ).toBeVisible();
  await expect(page.getByText("FND-014", { exact: true })).toHaveCount(0);
  await page.getByLabel("Interface review state").selectOption("integrity");
  await expect(page.locator(".v2-score strong")).toHaveText("—");
  await page
    .getByRole("button", { name: /Acquire forensic evidence before reimaging/ })
    .click();
  await expect(
    page
      .locator("#detail-criterion-2")
      .getByText("Digest Mismatch", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "We reimaged the affected endpoint to restore service. The disk image was not acquired before reimaging.",
    ),
  ).toHaveCount(0);
});
test("theme toggle and keyboard navigation remain functional", async ({
  page,
}) => {
  await page.goto(start);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator(".v2-app")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator(".v2-app")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) {
    await menu.click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(page.locator(".v2-sidebar")).toBeHidden();
  }
  await page.getByRole("link", { name: "Inspect readiness profiles" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 1, name: "Readiness profiles" }),
  ).toBeFocused();
});
test("pending requests do not overwrite a replacement workspace state", async ({
  page,
}) => {
  await page.goto(start);
  await page.getByLabel("Interface review state").selectOption("loading");
  await expect(
    page.getByRole("status", { name: "Loading workspace" }),
  ).toBeVisible();
  await page.getByLabel("Interface review state").selectOption("empty");
  await expect(
    page.getByRole("heading", { name: "No exercises in this view" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open evidence chain" }),
  ).toHaveCount(0);
});
