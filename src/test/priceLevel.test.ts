import { describe, it, expect } from "vitest";
import { formatPriceLevel } from "../utils/priceLevel";

describe("formatPriceLevel", () => {
  it('returns "$" for PRICE_LEVEL_INEXPENSIVE', () => {
    expect(formatPriceLevel("PRICE_LEVEL_INEXPENSIVE")).toBe("$");
  });

  it('returns "$$" for PRICE_LEVEL_MODERATE', () => {
    expect(formatPriceLevel("PRICE_LEVEL_MODERATE")).toBe("$$");
  });

  it('returns "$$$" for PRICE_LEVEL_EXPENSIVE', () => {
    expect(formatPriceLevel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$");
  });

  it('returns "$$$$" for PRICE_LEVEL_VERY_EXPENSIVE', () => {
    expect(formatPriceLevel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$");
  });

  it("returns undefined for PRICE_LEVEL_FREE (unknown value)", () => {
    expect(formatPriceLevel("PRICE_LEVEL_FREE")).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(formatPriceLevel(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(formatPriceLevel("")).toBeUndefined();
  });
});
