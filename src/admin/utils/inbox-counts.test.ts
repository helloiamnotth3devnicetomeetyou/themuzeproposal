import { describe, expect, it, vi } from "vitest";
import { getAdminInboxCounts } from "./inbox-counts";

const countQuery = (count: number) => {
  const query = {
    eq: vi.fn().mockResolvedValue({ count, error: null }),
    is: vi.fn(),
  };
  query.is.mockReturnValue(query);
  return query;
};

describe("getAdminInboxCounts", () => {
  it("uses pending counts for every inbox surface", async () => {
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce({ select: vi.fn(() => countQuery(1)) })
        .mockReturnValueOnce({ select: vi.fn(() => countQuery(2)) })
        .mockReturnValueOnce({ select: vi.fn(() => countQuery(3)) }),
    };

    await expect(getAdminInboxCounts(client as never)).resolves.toEqual({
      auditions: 1,
      contacts: 2,
      reports: 3,
    });
  });
});
