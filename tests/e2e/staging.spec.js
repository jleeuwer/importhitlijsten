import { test, expect } from "@playwright/test";

test("health endpoint works", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.ok()).toBeTruthy();
  const json = await r.json();
  expect(json.ok).toBe(true);
});

test("db-health endpoint returns a structured status", async ({ request }) => {
  const r = await request.get("/api/db-health");
  expect([200, 503]).toContain(r.status());
  const json = await r.json();
  expect(typeof json.ok).toBe("boolean");
  expect(typeof json.latencyMs).toBe("number");
});

test("Discogs search validates missing artist and title", async ({ request }) => {
  const r = await request.get("/api/discogs/search?type=master");
  expect(r.status()).toBe(400);
  const json = await r.json();
  expect(json.error).toMatch(/artist or title is required/i);
});
