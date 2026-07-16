import { describe, it, expect } from "vitest";
import { languageForExtension } from "./monacoLang";

describe("languageForExtension", () => {
  it("maps known extensions to their Monaco language id", () => {
    expect(languageForExtension("ts")).toBe("typescript");
    expect(languageForExtension("tsx")).toBe("typescript");
    expect(languageForExtension("js")).toBe("javascript");
    expect(languageForExtension("py")).toBe("python");
    expect(languageForExtension("md")).toBe("markdown");
    expect(languageForExtension("rs")).toBe("rust");
  });

  it("is case-insensitive", () => {
    expect(languageForExtension("TS")).toBe("typescript");
    expect(languageForExtension("Py")).toBe("python");
  });

  it("falls back to plaintext for unknown extensions", () => {
    expect(languageForExtension("xyz")).toBe("plaintext");
    expect(languageForExtension("")).toBe("plaintext");
  });

  it("falls back to plaintext for null (no extension / extensionless file)", () => {
    expect(languageForExtension(null)).toBe("plaintext");
  });
});
