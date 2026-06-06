import { test, expect, describe } from "bun:test";
import { formatVND, formatVNDSymbol, parseVND } from "./money";

describe("formatVND", () => {
  test("adds thousand separators", () => {
    expect(formatVND(10000)).toBe("10,000");
    expect(formatVND(1234567)).toBe("1,234,567");
    expect(formatVND(0)).toBe("0");
    expect(formatVND(999)).toBe("999");
  });
});

describe("formatVNDSymbol", () => {
  test("prefixes ₫", () => {
    expect(formatVNDSymbol(10000)).toBe("₫10,000");
    expect(formatVNDSymbol(0)).toBe("₫0");
  });
  test("handles negatives", () => {
    expect(formatVNDSymbol(-5000)).toBe("-₫5,000");
  });
});

describe("parseVND", () => {
  test("strips commas, spaces and symbol", () => {
    expect(parseVND("10,000")).toBe(10000);
    expect(parseVND("₫1,234,567")).toBe(1234567);
    expect(parseVND(" 5 000 ")).toBe(5000);
  });
  test("empty / invalid -> 0", () => {
    expect(parseVND("")).toBe(0);
    expect(parseVND("abc")).toBe(0);
  });
  test("drops fractional and sign", () => {
    expect(parseVND("-10000")).toBe(10000);
    expect(parseVND("10000.50")).toBe(1000050); // decimals are just digits in VND context
  });
  test("round-trips with formatVND", () => {
    for (const n of [0, 999, 10000, 1234567]) {
      expect(parseVND(formatVND(n))).toBe(n);
    }
  });
});
