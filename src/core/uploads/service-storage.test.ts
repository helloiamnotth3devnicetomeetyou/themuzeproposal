import { describe, expect, it } from "vitest";
import { isSafeStoragePath } from "./service-storage";

describe("isSafeStoragePath", () => {
  it.each(["foo/./bar.txt", "foo/../bar.txt"])(
    "rejects dot segments: %s",
    (path) => expect(isSafeStoragePath(path)).toBe(false),
  );
});
