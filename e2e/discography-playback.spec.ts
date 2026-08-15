import { test, expect } from "@playwright/test";

test.describe("Discography Playback", () => {
  test("redirects /discography to /rescene/discography", async ({
    request,
  }) => {
    const response = await request.get("/discography", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(await response.text()).toContain("/rescene/discography");
  });
});
