// Maps a file extension to the JDoodle Compiler API's language code +
// versionIndex. Only extensions listed here get a "Run" button in the
// Editor — everything else (html, css, json, md, txt, yml...) has no
// meaningful "run" behavior and is left alone.
export interface RunTarget {
  language: string;
  versionIndex: string;
  label: string;
}

const EXT_TO_RUN_TARGET: Record<string, RunTarget> = {
  java: { language: "java", versionIndex: "6", label: "Java (JDK 25)" },
  py: { language: "python3", versionIndex: "6", label: "Python 3.14" },
  c: { language: "c", versionIndex: "7", label: "C (GCC 15)" },
  cpp: { language: "cpp17", versionIndex: "3", label: "C++17 (GCC 15)" },
  cs: { language: "csharp", versionIndex: "6", label: "C# (.NET 10)" },
  js: { language: "nodejs", versionIndex: "7", label: "Node.js 25" },
  jsx: { language: "nodejs", versionIndex: "7", label: "Node.js 25" },
  ts: { language: "typescript", versionIndex: "1", label: "TypeScript 5.9" },
  php: { language: "php", versionIndex: "6", label: "PHP 8.5" },
  go: { language: "go", versionIndex: "6", label: "Go 1.26" },
  rs: { language: "rust", versionIndex: "6", label: "Rust 1.94" },
  sql: { language: "sql", versionIndex: "6", label: "SQLite 3.49" },
};

export function runTargetForExtension(ext: string | null): RunTarget | null {
  if (!ext) return null;
  return EXT_TO_RUN_TARGET[ext.toLowerCase()] ?? null;
}
