export type DraftDiffKind = "change" | "add" | "delete" | "order";

export type DraftDiffItem = {
  kind: DraftDiffKind;
  field: string;
  before: string;
  after: string;
};

const empty = (value: unknown) => value == null || value === "";

const display = (value: unknown) => {
  if (empty(value)) return "없음";
  if (typeof value === "boolean") return value ? "예" : "아니요";
  if (Array.isArray(value)) return `${value.length}개`;
  if (typeof value === "object") return "변경됨";
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
};

const itemKey = (value: unknown) => {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const item = value as Record<string, unknown>;
  return String(item.id ?? item.key ?? item.slug ?? item.url ?? JSON.stringify(value));
};

export function buildDraftDiff(
  before: unknown,
  after: unknown,
  labels: Record<string, string> = {},
): DraftDiffItem[] {
  const previous = before && typeof before === "object" ? before as Record<string, unknown> : {};
  const next = after && typeof after === "object" ? after as Record<string, unknown> : {};

  return [...new Set([...Object.keys(previous), ...Object.keys(next)])].flatMap((field) => {
    const from = previous[field];
    const to = next[field];
    if (JSON.stringify(from) === JSON.stringify(to)) return [];

    let kind: DraftDiffKind = empty(from) ? "add" : empty(to) ? "delete" : "change";
    if (Array.isArray(from) && Array.isArray(to)) {
      const fromKeys = from.map(itemKey);
      const toKeys = to.map(itemKey);
      if (fromKeys.length === toKeys.length && [...fromKeys].sort().join("\0") === [...toKeys].sort().join("\0")) kind = "order";
      else if (to.length > from.length) kind = "add";
      else if (to.length < from.length) kind = "delete";
    } else if (/order|sort/i.test(field)) {
      kind = "order";
    }

    return [{ kind, field: labels[field] || field, before: display(from), after: display(to) }];
  });
}
