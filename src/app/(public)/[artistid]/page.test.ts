import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("next/navigation", () => navigation);

import ArtistRootPage from "./page";

describe("artist root redirect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects a canonical artist slug", async () => {
    await ArtistRootPage({ params: Promise.resolve({ artistid: "res-cene" }) });
    expect(navigation.redirect).toHaveBeenCalledWith("/res-cene/artist");
  });

  it("rejects a decoded protocol-relative route segment", async () => {
    navigation.notFound.mockImplementationOnce(() => { throw new Error("not found"); });
    await expect(ArtistRootPage({ params: Promise.resolve({ artistid: "//attacker.example" }) })).rejects.toThrow("not found");
    expect(navigation.notFound).toHaveBeenCalledOnce();
    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});
