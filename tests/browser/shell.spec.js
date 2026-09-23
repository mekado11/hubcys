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

test("overview exposes the exercise result without inventing organization readiness", async ({ page }) => {
  await page.goto(start);
  await expect(page.locator(".v2-exercise-score strong")).toHaveText("60");
  await expect(page.locator(".v2-scope-strip")).toContainText("Organization readiness Not measured");
  await page.getByRole("link", { name: "Evidence Preservation 56", exact: true }).click();
  await expect(page.locator(".v2-score strong")).toHaveText("56");
  await expect(page).toHaveURL(/capability=evidence_preservation/);
  await navigate(page, "Overview");
  await page.getByLabel("Interface review state").selectOption("integrity");
  await expect(page.locator(".v2-exercise-score strong")).toHaveText("—");
  await page.getByLabel("Interface review state").selectOption("restricted");
  await expect(page.getByRole("alert")).toContainText("Evidence unavailable");
  await expect(page.locator(".v2-exercise-score")).toHaveCount(0);
});

test("corrective actions retain their verification state and finding trace", async ({ page }) => {
  await page.goto(start);
  await navigate(page, "Remediation");
  await expect(page.locator(".v2-action-row")).toHaveCount(1);
  await expect(page.locator(".v2-action-row")).toContainText("ACT-021");
  await expect(page.locator(".v2-action-row")).toContainText("Finding FND-014");
  await page.getByRole("button", { name: "Verified 0", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No actions in this selection" })).toBeVisible();
  await page.getByRole("button", { name: "Awaiting verification 1", exact: true }).click();
  await expect(page.locator(".v2-action-row")).toContainText("Ready For Verification");
  await page.getByRole("link", { name: "Trace finding" }).click();
  await expect(page.locator(".v2-score strong")).toHaveText("56");
  await expect(page.getByText("FND-014", { exact: true })).toBeVisible();
});

test("threat index toggles and the synthetic create form never claims a save", async ({ page }) => {
  await page.goto(start);
  await navigate(page, "Readiness");
  const threat = page.getByRole("button", { name: "Cloud Compromise 1 exercise in view" });
  await threat.click();
  await expect(page.getByLabel("Threat profile")).toHaveValue("cloud_compromise");
  await expect(page.locator(".v2-exercise-row")).toHaveCount(1);
  await threat.click();
  await expect(page.getByLabel("Threat profile")).toHaveValue("all");
  await page.getByRole("button", { name: "Show all threat profiles" }).click();
  await expect(page.locator(".v2-profile-index button")).toHaveCount(12);
  await page.getByRole("button", { name: "Show fewer profiles" }).click();
  await expect(page.locator(".v2-profile-index button")).toHaveCount(3);
  await navigate(page, "Exercises");
  await page.getByRole("link", { name: "Create ransomware exercise" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ransomware response exercise");
  await page.getByRole("checkbox", { name: "synthetic-responder Participant" }).check();
  await expect(page.getByRole("button", { name: "Create exercise", exact: true })).toBeDisabled();
  await expect(page.getByRole("note")).toContainText("read-only");
});

test("enterprise palette preserves readable navigation and primary actions in both themes", async ({ page }) => {
  await page.goto(start);
  await expect(page.locator(".v2-exercise-score strong")).toHaveText("60");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Switch to dark mode" }).click();
    const menu = page.getByRole("button", { name: "Open navigation", exact: true });
    const mobile = await menu.isVisible();
    if (mobile) await menu.click();
    const ratios = await page.evaluate(() => {
      const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => {
          const value = n / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      return [".v2-sidebar nav a.active", ".v2-panel-footer .v2-button"].map(selector => {
        const style = getComputedStyle(document.querySelector(selector));
        const foreground = luminance(style.color);
        const background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
    });
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    if (mobile) await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.getByLabel("Interface review state").selectOption("empty");
  await expect(page.getByRole("link", { name: "Explore exercises" })).toBeVisible();
  await expect(page.locator(".v2-exercise-score")).toHaveCount(0);
});

test("live preview separates released artifacts, facilitator authority and participant responses", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(start);
  await page.getByRole("link", { name: "Live exercise preview", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Facilitator controls", exact: true })).toBeVisible();
  await expect(page.locator(".v2-timeline-event")).toHaveCount(2);
  await expect(page.locator(".v2-queue-item")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Release Business owner impact request", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "End response phase", exact: true })).toBeDisabled();
  await expect(page.locator(".v2-response-record")).toHaveCount(2);
  await page.locator(".v2-queue-item").last().getByText("Inspect scenario text", { exact: true }).click();
  await expect(page.locator(".v2-queue-item").last()).toContainText("Operations requests a factual impact update");
  await page.getByLabel("Interface review state").selectOption("participant");
  await expect(page.getByRole("heading", { name: "Record your response", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Facilitator controls", exact: true })).toHaveCount(0);
  await expect(page.getByText("Business owner impact request", { exact: true })).toHaveCount(0);
  await expect(page.locator(".v2-response-record")).toHaveCount(1);
  await page.getByRole("button", { name: "Respond to New privileged credential", exact: true }).click();
  await expect(page.getByLabel("Released inject", { exact: true })).toHaveValue("release-2");
  await expect(page.getByRole("button", { name: "Submit response", exact: true })).toBeDisabled();
  await expect(page.getByRole("note")).toContainText("Read-only synthetic workspace");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
