import { test, expect, describe } from "bun:test";
import { calcForecast, calcStatus, calcPercentUsed } from "@/lib/budget";

describe("calcForecast", () => {
  test("returns 0 when no days have elapsed", () => {
    expect(calcForecast(500_000, 0, 30)).toBe(0);
  });

  test("projects correctly mid-month", () => {
    // 1_500_000 spent over 15 days in a 30-day month → 3_000_000 forecast
    expect(calcForecast(1_500_000, 15, 30)).toBe(3_000_000);
  });

  test("equals spent on the last day (fully elapsed)", () => {
    expect(calcForecast(2_000_000, 31, 31)).toBe(2_000_000);
  });

  test("rounds to the nearest VND integer", () => {
    // 1_000_000 / 3 * 31 = 10_333_333.333… → rounded
    expect(calcForecast(1_000_000, 3, 31)).toBe(10_333_333);
  });

  test("handles zero spend", () => {
    expect(calcForecast(0, 10, 30)).toBe(0);
  });
});

describe("calcStatus", () => {
  test("on_track when under 80 %", () => {
    expect(calcStatus(799_999, 1_000_000)).toBe("on_track");
    expect(calcStatus(0, 1_000_000)).toBe("on_track");
  });

  test("warning at exactly 80 %", () => {
    expect(calcStatus(800_000, 1_000_000)).toBe("warning");
  });

  test("warning between 80 % and 100 %", () => {
    expect(calcStatus(999_999, 1_000_000)).toBe("warning");
  });

  test("still warning at exactly 100 % (warning covers 80–100 % inclusive)", () => {
    expect(calcStatus(1_000_000, 1_000_000)).toBe("warning");
  });

  test("exceeded strictly above 100 %", () => {
    expect(calcStatus(1_000_001, 1_000_000)).toBe("exceeded");
    expect(calcStatus(1_500_000, 1_000_000)).toBe("exceeded");
  });

  test("falls back to on_track when cap is zero", () => {
    expect(calcStatus(500_000, 0)).toBe("on_track");
  });
});

describe("calcPercentUsed", () => {
  test("returns 0 when nothing spent", () => {
    expect(calcPercentUsed(0, 1_000_000)).toBe(0);
  });

  test("returns 50 at half capacity", () => {
    expect(calcPercentUsed(500_000, 1_000_000)).toBe(50);
  });

  test("returns 100 at full capacity", () => {
    expect(calcPercentUsed(1_000_000, 1_000_000)).toBe(100);
  });

  test("returns above 100 when over budget", () => {
    expect(calcPercentUsed(1_200_000, 1_000_000)).toBe(120);
  });

  test("rounds fractional percentages", () => {
    // 1 / 3 * 100 = 33.33… → 33
    expect(calcPercentUsed(1, 3)).toBe(33);
  });

  test("returns 0 when cap is zero (no divide-by-zero)", () => {
    expect(calcPercentUsed(500_000, 0)).toBe(0);
  });
});
