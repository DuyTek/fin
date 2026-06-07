import { test, expect, describe } from "bun:test";
import { json, error, isTxType, parseAmount, parseDate, parseId, ValidationError } from "@/server/http";

describe("isTxType", () => {
  test("returns true for valid types", () => {
    expect(isTxType("income")).toBe(true);
    expect(isTxType("expense")).toBe(true);
  });

  test("returns false for anything else", () => {
    expect(isTxType("other")).toBe(false);
    expect(isTxType("")).toBe(false);
    expect(isTxType(null)).toBe(false);
    expect(isTxType(1)).toBe(false);
    expect(isTxType(undefined)).toBe(false);
  });
});

describe("parseAmount", () => {
  test("accepts positive integers as numbers", () => {
    expect(parseAmount(100)).toBe(100);
    expect(parseAmount(1000000)).toBe(1000000);
    expect(parseAmount(1)).toBe(1);
  });

  test("accepts positive integer strings", () => {
    expect(parseAmount("500")).toBe(500);
    expect(parseAmount("1")).toBe(1);
  });

  test("throws for zero", () => {
    expect(() => parseAmount(0)).toThrow(ValidationError);
  });

  test("throws for negative", () => {
    expect(() => parseAmount(-1)).toThrow(ValidationError);
    expect(() => parseAmount("-100")).toThrow(ValidationError);
  });

  test("throws for non-integer", () => {
    expect(() => parseAmount(1.5)).toThrow(ValidationError);
    expect(() => parseAmount("1.5")).toThrow(ValidationError);
  });

  test("throws for non-numeric", () => {
    expect(() => parseAmount("abc")).toThrow(ValidationError);
    expect(() => parseAmount(null)).toThrow(ValidationError);
    expect(() => parseAmount(undefined)).toThrow(ValidationError);
  });
});

describe("parseDate", () => {
  test("accepts valid YYYY-MM-DD string", () => {
    expect(parseDate("2026-06-07")).toBe("2026-06-07");
    expect(parseDate("2026-01-01")).toBe("2026-01-01");
  });

  test("throws for non-string types", () => {
    expect(() => parseDate(20260607)).toThrow(ValidationError);
    expect(() => parseDate(null)).toThrow(ValidationError);
  });

  test("throws for wrong format", () => {
    expect(() => parseDate("06-07-2026")).toThrow(ValidationError);
    expect(() => parseDate("2026/06/07")).toThrow(ValidationError);
    expect(() => parseDate("2026-6-7")).toThrow(ValidationError);
    expect(() => parseDate("")).toThrow(ValidationError);
  });
});

describe("parseId", () => {
  test("returns positive integer from string", () => {
    expect(parseId("1")).toBe(1);
    expect(parseId("42")).toBe(42);
    expect(parseId("999")).toBe(999);
  });

  test("returns null for zero", () => {
    expect(parseId("0")).toBeNull();
  });

  test("returns null for negative", () => {
    expect(parseId("-1")).toBeNull();
  });

  test("returns null for non-numeric strings", () => {
    expect(parseId("abc")).toBeNull();
    expect(parseId("")).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(parseId(undefined)).toBeNull();
  });
});

describe("json", () => {
  test("creates a 200 JSON response by default", async () => {
    const res = json({ foo: "bar" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = await res.json();
    expect(body).toEqual({ foo: "bar" });
  });

  test("accepts a custom status code", async () => {
    const res = json({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });

  test("serialises arrays", async () => {
    const res = json([1, 2, 3]);
    expect(await res.json()).toEqual([1, 2, 3]);
  });
});

describe("error", () => {
  test("wraps message in {error} shape with 400 by default", async () => {
    const res = error("bad input");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "bad input" });
  });

  test("accepts a custom status code", async () => {
    const res = error("not found", 404);
    expect(res.status).toBe(404);
  });
});
