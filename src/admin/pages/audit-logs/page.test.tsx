import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuditLogsAdminPage from "./page";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  range: vi.fn(),
  ilike: vi.fn(),
}));

vi.mock("@/core/supabase/client", () => {
  const result = {
    data: [
      {
        id: 17,
        occurred_at: "2026-07-28T01:00:00.000Z",
        actor_id: "00000000-0000-0000-0000-000000000101",
        actor_email: "admin@themuze.kr",
        operation: "UPDATE",
        table_name: "artists",
        record_id: "00000000-0000-0000-0000-000000000201",
        record_label: "RESCENE",
        changed_fields: ["name"],
        before_values: { name: "Old name" },
        after_values: { name: "New name" },
        transaction_id: 801,
      },
    ],
    count: 51,
    error: null,
  };

  const query: Record<string, unknown> = {};
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.range = (...args: unknown[]) => {
    mocks.range(...args);
    return query;
  };
  query.gte = vi.fn(() => query);
  query.lt = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.ilike = (...args: unknown[]) => {
    mocks.ilike(...args);
    return query;
  };
  query.then = (
    resolve: (value: typeof result) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);

  mocks.from.mockImplementation(() => query);
  return { supabase: { from: mocks.from } };
});

describe("AuditLogsAdminPage", () => {
  beforeEach(() => {
    mocks.from.mockClear();
    mocks.range.mockClear();
    mocks.ilike.mockClear();
  });

  it("loads logs, filters by administrator, paginates, and shows field changes", async () => {
    const user = userEvent.setup();
    render(<AuditLogsAdminPage />);

    expect(await screen.findByText("RESCENE")).toBeInTheDocument();
    expect(mocks.from).toHaveBeenCalledWith("admin_audit_logs");
    expect(mocks.range).toHaveBeenCalledWith(0, 49);

    await user.click(
      screen.getByRole("button", { name: "RESCENE 변경 상세 보기" }),
    );
    expect(screen.getByText("Old name")).toBeInTheDocument();
    expect(screen.getByText("New name")).toBeInTheDocument();
    expect(screen.getByText("트랜잭션")).toBeInTheDocument();

    await user.type(screen.getByLabelText("관리자 이메일"), "admin@themuze.kr");
    await user.click(screen.getByRole("button", { name: /이력 조회/ }));
    await waitFor(() =>
      expect(mocks.ilike).toHaveBeenCalledWith(
        "actor_email",
        "%admin@themuze.kr%",
      ),
    );

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await waitFor(() => expect(mocks.range).toHaveBeenCalledWith(50, 99));
  });
});
