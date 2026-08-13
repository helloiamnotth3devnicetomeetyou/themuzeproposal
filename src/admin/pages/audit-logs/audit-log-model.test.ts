import { describe, expect, it } from "vitest";
import {
  auditFields,
  fieldLabel,
  formatAuditValue,
  operationLabel,
  tableLabel,
  type AuditLogRow,
} from "./audit-log-model";

const row: AuditLogRow = {
  id: 1,
  occurred_at: "2026-07-28T01:00:00.000Z",
  actor_id: "actor-id",
  actor_email: "admin@example.com",
  operation: "UPDATE",
  table_name: "artists",
  record_id: "artist-id",
  record_label: "RESCENE",
  changed_fields: ["name", "is_active"],
  before_values: { name: "Old", is_active: false },
  after_values: { name: "New", is_active: true },
  transaction_id: 42,
};

describe("audit log presentation model", () => {
  it("maps database names to administrator-facing labels", () => {
    expect(tableLabel("artist_members")).toBe("멤버");
    expect(fieldLabel("is_published")).toBe("공개 상태");
    expect(operationLabel("DELETE")).toBe("삭제");
  });

  it("keeps unknown database names visible", () => {
    expect(tableLabel("future_table")).toBe("future_table");
    expect(fieldLabel("future_field")).toBe("future_field");
  });

  it("builds a field-by-field before and after comparison", () => {
    expect(auditFields(row)).toEqual([
      { field: "name", before: "Old", after: "New" },
      { field: "is_active", before: false, after: true },
    ]);
  });

  it("formats empty, boolean, scalar, and structured values", () => {
    expect(formatAuditValue(null)).toBe("없음");
    expect(formatAuditValue(true)).toBe("사용");
    expect(formatAuditValue(3)).toBe("3");
    expect(formatAuditValue({ key: "value" })).toContain('"key": "value"');
  });
});
