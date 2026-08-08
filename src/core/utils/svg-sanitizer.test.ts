// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sanitizeSvg, UnsafeSvgError } from "./svg-sanitizer";

describe("sanitizeSvg", () => {
  it("removes executable SVG content", () => {
    const sanitized = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)"><text>Logo</text></a></svg>');

    expect(sanitized).toContain("Logo");
    expect(sanitized).not.toMatch(/script|onload|javascript:/i);
  });

  it.each([
    "",
    "<!DOCTYPE svg><svg></svg>",
    "<html><body>not svg</body></html>",
  ])("rejects unsafe or non-SVG input", (source) => {
    expect(() => sanitizeSvg(source)).toThrow(UnsafeSvgError);
  });
});
