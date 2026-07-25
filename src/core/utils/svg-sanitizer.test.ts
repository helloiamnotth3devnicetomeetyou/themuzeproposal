// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("sharp", () => ({ default: vi.fn() }));

const { sanitizeSvg, UnsafeSvgError } = await import("./svg-sanitizer");

describe("sanitizeSvg", () => {
  it("keeps allowed SVG markup and adds the SVG namespace", () => {
    expect(sanitizeSvg("<svg viewBox='0 0 10 10'><path d='M0 0' fill='#fff'/></svg>"))
      .toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0" fill="#fff"/></svg>');
  });

  it.each([
    "<svg><script>alert(1)</script></svg>",
    "<svg onload='alert(1)'></svg>",
    "<svg><use href='javascript:alert(1)'/></svg>",
    "<!DOCTYPE svg><svg></svg>",
    "<svg><foreignObject/></svg>",
    "<svg><path fill='red' fill='blue'/></svg>",
    "<svg><g></svg>",
  ])("rejects unsafe markup: %s", (source) => {
    expect(() => sanitizeSvg(source)).toThrow(UnsafeSvgError);
  });
});
