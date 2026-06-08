import { test, expect, describe } from "bun:test";
import { monthRange, shiftMonth, formatMonthLabel, todayISO, currentMonth } from "@/lib/dates";

describe("todayISO", () => {
  test("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("currentMonth", () => {
  test("returns a YYYY-MM string", () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });

  test("matches the year-month portion of todayISO", () => {
    expect(currentMonth()).toBe(todayISO().slice(0, 7));
  });
});

describe("monthRange", () => {
  test("returns first and last day for a 31-day month", () => {
    expect(monthRange("2026-01")).toEqual({ from: "2026-01-01", to: "2026-01-31" });
    expect(monthRange("2026-03")).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });

  test("returns correct last day for a 30-day month", () => {
    expect(monthRange("2026-04")).toEqual({ from: "2026-04-01", to: "2026-04-30" });
    expect(monthRange("2026-11")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
  });

  test("returns correct last day for February in a non-leap year", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  test("returns correct last day for February in a leap year", () => {
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
  });

  test("zero-pads single-digit month and day", () => {
    expect(monthRange("2026-09")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });
});

describe("shiftMonth", () => {
  test("advances forward by 1", () => {
    expect(shiftMonth("2026-01", 1)).toBe("2026-02");
    expect(shiftMonth("2026-06", 1)).toBe("2026-07");
  });

  test("wraps from December to January", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  test("goes backward by 1", () => {
    expect(shiftMonth("2026-03", -1)).toBe("2026-02");
  });

  test("wraps from January back to December", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  test("handles large deltas", () => {
    expect(shiftMonth("2026-06", 6)).toBe("2026-12");
    expect(shiftMonth("2026-06", 12)).toBe("2027-06");
  });
});

describe("formatMonthLabel", () => {
  test("formats January correctly", () => {
    expect(formatMonthLabel("2026-01")).toBe("January 2026");
  });

  test("formats June correctly", () => {
    expect(formatMonthLabel("2026-06")).toBe("June 2026");
  });

  test("formats December correctly", () => {
    expect(formatMonthLabel("2026-12")).toBe("December 2026");
  });
});
