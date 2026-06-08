import { test, expect, describe } from "bun:test";
import { cn } from "@/lib/utils";

describe("cn", () => {
  test("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("filters falsy values", () => {
    const condition = false;
    expect(cn("foo", condition && "bar", null, undefined)).toBe("foo");
    expect(cn("foo", undefined, "baz")).toBe("foo baz");
  });

  test("tailwind-merge deduplicates conflicting utility classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("font-bold", "font-normal")).toBe("font-normal");
  });

  test("keeps non-conflicting classes", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });

  test("handles conditional class objects", () => {
    expect(cn({ "bg-red-500": true, "bg-blue-500": false })).toBe("bg-red-500");
  });
});
