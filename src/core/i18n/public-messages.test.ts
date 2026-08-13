import { describe, expect, it } from "vitest";
import { publicMessages } from "./public-messages";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shape(child)]),
    );
  }
  return typeof value;
}

function stringLeaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(stringLeaves);
  return [];
}

describe("public messages", () => {
  it("keeps the same message shape for every locale", () => {
    expect(shape(publicMessages.en)).toEqual(shape(publicMessages.ko));
    expect(shape(publicMessages.ja)).toEqual(shape(publicMessages.ko));
  });

  it("does not mix Hangul into Japanese messages", () => {
    expect(
      stringLeaves(publicMessages.ja).filter((message) =>
        /[가-힣]/u.test(message),
      ),
    ).toEqual([]);
  });
});
