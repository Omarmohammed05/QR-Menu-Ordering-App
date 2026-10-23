import { describe, expect, it } from "vitest";
import {
  buildOrderMessage,
  buildWhatsAppOrderUrl,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it("keeps a valid E.164 number", () => {
    expect(normalizeWhatsAppNumber("+201000000000")).toBe("+201000000000");
  });

  it("strips separators", () => {
    expect(normalizeWhatsAppNumber("+20 100-000 (0000)")).toBe("+201000000000");
  });

  it("converts 00-prefix to +", () => {
    expect(normalizeWhatsAppNumber("00201000000000")).toBe("+201000000000");
  });

  it("adds + to a bare international number", () => {
    expect(normalizeWhatsAppNumber("201000000000")).toBe("+201000000000");
  });

  it("rejects too-short numbers", () => {
    expect(normalizeWhatsAppNumber("+201234")).toBeNull();
  });

  it("rejects local numbers without a country code", () => {
    expect(normalizeWhatsAppNumber("01000000000")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(normalizeWhatsAppNumber("not-a-number")).toBeNull();
  });
});

describe("buildOrderMessage", () => {
  const lines = [
    { name: "Mint tea", qty: 2, unitPricePiastres: 1200 },
    { name: "Egyptian koshary", qty: 1, unitPricePiastres: 6500 },
  ];

  it("renders English lines and total", () => {
    const message = buildOrderMessage("en", "Demo Bistro", lines, 8900);
    expect(message).toContain("Hello, I'd like to order from Demo Bistro:");
    expect(message).toContain("• 2 × Mint tea — EGP\u00a024.00");
    expect(message).toContain("• 1 × Egyptian koshary — EGP\u00a065.00");
    expect(message).toContain("Total: EGP\u00a089.00");
  });

  it("renders Arabic greeting and total", () => {
    const message = buildOrderMessage("ar", "مطعم التجربة", lines, 8900);
    expect(message).toContain("مرحبًا، أودّ الطلب من مطعم التجربة:");
    expect(message).toContain("الإجمالي:");
  });
});

describe("buildWhatsAppOrderUrl", () => {
  it("builds a wa.me link with an encoded message", () => {
    const url = buildWhatsAppOrderUrl({
      locale: "en",
      restaurantName: "Demo Bistro",
      whatsappNumber: "+20 100-000 0000",
      lines: [{ name: "Mint tea", qty: 1, unitPricePiastres: 1200 }],
      totalPiastres: 1200,
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/201000000000\?text=/);
    expect(url).toContain(encodeURIComponent("Mint tea"));
  });

  it("returns null for an invalid stored number", () => {
    const url = buildWhatsAppOrderUrl({
      locale: "en",
      restaurantName: "Demo Bistro",
      whatsappNumber: "broken",
      lines: [],
      totalPiastres: 0,
    });
    expect(url).toBeNull();
  });
});
