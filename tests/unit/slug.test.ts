import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, slugify, validateSlug } from "@/lib/slug";

describe("validateSlug", () => {
  it("accepts valid slugs and normalizes case/whitespace", () => {
    expect(validateSlug("koshary")).toEqual({ ok: true, slug: "koshary" });
    expect(validateSlug("koshary-el-tahrir")).toEqual({ ok: true, slug: "koshary-el-tahrir" });
    expect(validateSlug("  cafe-123 ")).toEqual({ ok: true, slug: "cafe-123" });
    expect(validateSlug("CAFE")).toEqual({ ok: true, slug: "cafe" });
  });

  it("rejects invalid formats", () => {
    for (const bad of [
      "",
      "ab", // too short
      "-koshary", // leading hyphen
      "koshary-", // trailing hyphen
      "Koshary!", // invalid character
      "شاورما", // non-latin
      "a".repeat(40), // too long
    ]) {
      expect(validateSlug(bad), `"${bad}" should be invalid`).toEqual({
        ok: false,
        reason: "format",
      });
    }
  });

  it("rejects reserved words", () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(validateSlug(reserved)).toEqual({ ok: false, reason: "reserved" });
    }
  });
});

describe("slugify", () => {
  it("slugifies latin names", () => {
    expect(slugify("Koshary El Tahrir")).toBe("koshary-el-tahrir");
    expect(slugify("  Café #12  ")).toBe("caf-12");
  });

  it("returns empty for non-latin input (owner enters a slug manually)", () => {
    expect(slugify("مطعم")).toBe("");
  });
});
