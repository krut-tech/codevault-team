const EXT_TO_LANG: Record<string, string> = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", php: "php", java: "java", c: "c", cpp: "cpp", cs: "csharp",
  html: "html", css: "css", json: "json", md: "markdown", txt: "plaintext",
  sql: "sql", go: "go", rs: "rust", yml: "yaml", yaml: "yaml",
};

export function languageForExtension(ext: string | null): string {
  if (!ext) return "plaintext";
  return EXT_TO_LANG[ext.toLowerCase()] ?? "plaintext";
}
