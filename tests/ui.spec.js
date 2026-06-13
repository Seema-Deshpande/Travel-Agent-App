import { test, expect } from "@playwright/test";

// All tests in this file mock the backend so they are fast and deterministic.
// Each test installs a route handler on **/api/chat before interacting.

async function mockChat(page, replyFor) {
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    const reply = replyFor(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply }),
    });
  });
}

// Each Playwright test runs in an isolated browser context, so localStorage
// starts empty — no manual clearing needed (and an init-script clear would wrongly
// re-run on reload, breaking the thread_id persistence test below).

test("1. page loads with title, input and send button", async ({ page }) => {
  await mockChat(page, () => "ok");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Travel Agent/i })).toBeVisible();
  await expect(page.getByTestId("message-input")).toBeVisible();
  await expect(page.getByTestId("send-button")).toBeVisible();
  await expect(page.getByText(/Ask me about destinations/i)).toBeVisible();
});

test("2. sending a message shows the user message and assistant reply", async ({ page }) => {
  await mockChat(page, () => "Here is a reply from the assistant.");
  await page.goto("/");
  await page.getByTestId("message-input").fill("Hello there");
  await page.getByTestId("send-button").click();

  await expect(page.getByTestId("message-user")).toHaveText("Hello there");
  await expect(page.getByTestId("message-assistant")).toHaveText(
    "Here is a reply from the assistant."
  );
});

test("3. input clears and loading state shows during in-flight request", async ({ page }) => {
  // Delay the response so we can observe the loading state.
  await page.route("**/api/chat", async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "Done." }),
    });
  });
  await page.goto("/");
  const input = page.getByTestId("message-input");
  await input.fill("weather please");
  await page.getByTestId("send-button").click();

  // Input clears immediately, loading indicator appears, input disabled.
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("loading")).toBeVisible();
  await expect(input).toBeDisabled();

  // After the response resolves, loading disappears and reply shows.
  await expect(page.getByTestId("loading")).toHaveCount(0);
  await expect(page.getByTestId("message-assistant")).toHaveText("Done.");
  await expect(input).toBeEnabled();
});

test("4. weather query renders a weather reply", async ({ page }) => {
  await mockChat(page, (body) =>
    body.message.toLowerCase().includes("weather")
      ? "Weather in Tokyo: 22°C, clear sky."
      : "..."
  );
  await page.goto("/");
  await page.getByTestId("message-input").fill("What's the weather in Tokyo?");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("message-assistant")).toHaveText(
    /Weather in Tokyo: 22°C/
  );
});

test("5. travel/search query renders a search-based reply", async ({ page }) => {
  await mockChat(
    page,
    () => "Top attractions in Paris: Eiffel Tower, Louvre, Notre-Dame."
  );
  await page.goto("/");
  await page.getByTestId("message-input").fill("What should I see in Paris?");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("message-assistant")).toHaveText(
    /Eiffel Tower/
  );
});

test("6. thread_id is created, persisted and reused across reload", async ({ page }) => {
  const sentThreadIds = [];
  await page.route("**/api/chat", async (route) => {
    sentThreadIds.push(route.request().postDataJSON().threadId);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "ack" }),
    });
  });

  await page.goto("/");
  await page.getByTestId("message-input").fill("first message");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("message-assistant")).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("threadId"));
  expect(stored).toBeTruthy();

  // Reload (localStorage persists) and send again — same thread_id should be reused.
  await page.reload();
  await page.getByTestId("message-input").fill("second message");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("message-assistant")).toBeVisible();

  expect(sentThreadIds).toHaveLength(2);
  expect(sentThreadIds[0]).toBe(sentThreadIds[1]);
  expect(sentThreadIds[0]).toBe(stored);
});

test("7. New chat clears messages and rotates the thread_id", async ({ page }) => {
  await mockChat(page, () => "reply");
  await page.goto("/");
  await page.getByTestId("message-input").fill("hi");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("message-assistant")).toBeVisible();

  const before = await page.evaluate(() => localStorage.getItem("threadId"));
  await page.getByTestId("new-chat-button").click();

  await expect(page.getByTestId("message-user")).toHaveCount(0);
  await expect(page.getByTestId("message-assistant")).toHaveCount(0);
  await expect(page.getByText(/Ask me about destinations/i)).toBeVisible();

  const after = await page.evaluate(() => localStorage.getItem("threadId"));
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);
});

test("8. backend error shows an error message and UI stays usable", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "boom" }),
    });
  });
  await page.goto("/");
  await page.getByTestId("message-input").fill("cause an error");
  await page.getByTestId("send-button").click();

  await expect(page.getByTestId("message-error")).toContainText(/Error:/);
  // Input is usable again after the failed request.
  await expect(page.getByTestId("message-input")).toBeEnabled();
});
