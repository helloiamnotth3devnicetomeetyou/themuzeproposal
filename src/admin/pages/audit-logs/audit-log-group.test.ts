import { describe, expect, it } from "vitest";
import { groupAuditLogs, type AuditLogRow } from "./audit-log-model";

const row = (id: number, transactionId: number): AuditLogRow => ({
  id, transaction_id: transactionId, occurred_at: "2026-08-08T00:00:00Z", actor_id: null,
  actor_email: null, operation: "UPDATE", table_name: "albums", record_id: String(id),
  record_label: `album ${id}`, changed_fields: [], before_values: null, after_values: null,
});

describe("groupAuditLogs", () => {
  it("keeps page order and groups records from one transaction", () => {
    const groups = groupAuditLogs([row(3, 20), row(2, 20), row(1, 10)]);
    expect(groups.map((group) => group.primary.id)).toEqual([3, 1]);
    expect(groups[0].entries.map((entry) => entry.id)).toEqual([3, 2]);
  });
});
