import { test, expect } from "@playwright/test";

// Live end-to-end smoke test: NO mocking. This drives the real agent
// (Gemini + Tavily + wttr.in) through the running Express backend.
// It is slower and can be flaky; run it explicitly with `npm run test:live`.

test("live: weather question returns a real assistant reply", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  await page.getByTestId("message-input").fill("What's the weather in Paris?");
  await page.getByTestId("send-button").click();

  const reply = page.getByTestId("message-assistant");
  await expect(reply).toBeVisible({ timeout: 80_000 });

  const text = (await reply.textContent())?.trim() ?? "";
  expect(text.length).toBeGreaterThan(0);
  // Expect a plausible weather signal: a temperature/degree marker or the city name.
  expect(text).toMatch(/(°|degree|\d|Paris)/i);
});
