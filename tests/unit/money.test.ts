import { describe, expect, it } from "vitest";
import { assertPiastres, formatMoney, parsePiastres } from "@/lib/money";

describe("assertPiastres", () => {
  it("accepts integers", () => {
    expect(assertPiastres(0)).toBe(0);
    expect(assertPiastres(12050)).toBe(12050);
    expect(assertPiastres(-250)).toBe(-250);
  });

  it("rejects non-integers", () => {
    expect(() => assertPiastres(120.5)).toThrow();
    expect(() => assertPiastres(NaN)).toThrow();
    expect(() => assertPiastres(Infinity)).toThrow();
  });
});

describe("formatMoney", () => {
  it("formats EGP for Arabic with Arabic-Indic digits by default", () => {
    // Intl wraps the output in RLM marks (U+200F) and NBSP (U+00A0) —
    // exactly the RTL-safety the spec asks for.
    expect(formatMoney(12050, "ar")).toBe("\u200f١٢٠٫٥٠\u00a0ج.م.\u200f");
  });

  it("formats EGP for English as EGP-prefixed", () => {
    expect(formatMoney(12050, "en")).toBe("EGP\u00a0120.50");
  });

  it("supports Western digits for Arabic when requested", () => {
    const western = formatMoney(12050, "ar", { arabicIndicDigits: false });
    expect(western).toContain("120.50");
  });

  it("formats small and large amounts without float drift", () => {
    expect(formatMoney(1, "ar")).toBe("\u200f٠٫٠١\u00a0ج.م.\u200f");
    expect(formatMoney(1, "en")).toBe("EGP\u00a00.01");
    expect(formatMoney(12345678901, "en")).toBe("EGP\u00a0123,456,789.01");
  });

  it("rejects non-integer piastres", () => {
    expect(() => formatMoney(10.5, "en")).toThrow();
  });
});

describe("parsePiastres", () => {
  it("parses whole, one-decimal and two-decimal inputs", () => {
    expect(parsePiastres("120")).toBe(12000);
    expect(parsePiastres("120.5")).toBe(12050);
    expect(parsePiastres("120.50")).toBe(12050);
    expect(parsePiastres(" 120.50 ")).toBe(12050);
  });

  it("rejects invalid input", () => {
    expect(() => parsePiastres("")).toThrow();
    expect(() => parsePiastres("12.345")).toThrow();
    expect(() => parsePiastres("-5")).toThrow();
    expect(() => parsePiastres("abc")).toThrow();
    expect(() => parsePiastres("1,200")).toThrow();
  });
});
