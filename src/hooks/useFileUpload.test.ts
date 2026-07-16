import { describe, it, expect } from "vitest";
import { extOf, sanitizeFileName } from "./useFileUpload";

describe("extOf", () => {
  it("extracts and lowercases the extension", () => {
    expect(extOf("Report.PDF")).toBe("pdf");
    expect(extOf("index.tsx")).toBe("tsx");
  });

  it("returns the last extension for multi-dot filenames", () => {
    expect(extOf("archive.tar.gz")).toBe("gz");
  });

  it("returns an empty string for extensionless filenames", () => {
    expect(extOf("Dockerfile")).toBe("");
    expect(extOf("README")).toBe("");
  });
});

describe("sanitizeFileName (regression: storage-path traversal, see QA report Finding #12)", () => {
  it("strips forward slashes so a crafted name cannot escape the folder prefix", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe(".._.._etc_passwd");
    expect(sanitizeFileName("a/b/c.txt")).toBe("a_b_c.txt");
  });

  it("strips backslashes too", () => {
    expect(sanitizeFileName("a\\b\\c.txt")).toBe("a_b_c.txt");
  });

  it("leaves ordinary filenames untouched", () => {
    expect(sanitizeFileName("my-notes_v2.md")).toBe("my-notes_v2.md");
  });
});
