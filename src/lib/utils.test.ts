import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins simple class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    const isEnabled = false;
    expect(cn("a", isEnabled && "b", undefined, null, "c")).toBe("a c");
  });

  it("resolves conflicting Tailwind utilities to the last one (tailwind-merge)", () => {
    // Regression guard: this is what makes e.g. `cn("p-2", condition && "p-4")`
    // safe to use for conditional overrides throughout the UI components.
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("supports object and array syntax", () => {
    expect(cn({ a: true, b: false }, ["c", "d"])).toBe("a c d");
  });
});
