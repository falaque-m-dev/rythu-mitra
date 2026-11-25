import { describe, expect, it } from "vitest";
import { formatCurrency } from "./utils";

describe("formatCurrency", () => {
  it("formats Indian rupee amounts without decimals", () => {
    expect(formatCurrency(2450)).toMatch(/2,450/);
  });

  it("rounds fractional values to whole rupees", () => {
    expect(formatCurrency(99.6)).toMatch(/100/);
  });
});
