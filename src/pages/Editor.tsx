import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import MonacoEditor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import { useFile, useSaveFile, useFileVersions } from "@/hooks/useFile";
import { languageForExtension } from "@/lib/monacoLang";
import { useEffect, useRef, useState } from "react";
import { Save, Maximize2, Minimize2, History, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Editor() {
  const { fileId } = useParams<{ fileId: string }>();
  const { data: file, isLoading } = useFile(fileId);
  const { data: versions } = useFileVersions(fileId);
  const saveFile = useSaveFile();

  const [content, setContent] = useState("");
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [fullscreen, setFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dirtyRef = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// Intentionally keyed only on file.id: we want to load content when the
// user switches files, but NOT on every background refetch of `file`
// (react-query), which would clobber in-progress unsaved edits.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (file?.content !== undefined && file?.content !== null) setContent(file.content);
  // oxlint-disable-next-line
}, [file?.id]);

  function handleChange(value: string | undefined) {
    setContent(value ?? "");
    dirtyRef.current = true;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (fileId && dirtyRef.current) {
        saveFile.mutate({ id: fileId, content: value ?? "" });
        dirtyRef.current = false;
      }
    }, 2000);
  }

  function handleManualSave() {
    if (!fileId) return;
    saveFile.mutate(
      { id: fileId, content },
      { onSuccess: () => toast.success("Saved"), onError: () => toast.error("Save failed") }
    );
    dirtyRef.current = false;
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }

  if (isLoading) {
    return (
      <AppLayout title="Editor" subtitle="Loading file...">
        <p className="text-sm text-text-secondary">Loading…</p>
      </AppLayout>
    );
  }

  const editorPane = (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-bg-primary" : "flex h-[calc(100vh-220px)] flex-col overflow-hidden rounded-xl border border-border-subtle"}>
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{file?.name}</span>
          {file?.extension && <Badge variant="brand">{file.extension}</Badge>}
          {saveFile.isPending && <span className="text-xs text-text-muted">Saving…</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Copy code" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Toggle version history" onClick={() => setShowHistory((s) => !s)}><History className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Toggle editor theme" onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}>
            {theme === "vs-dark" ? "☀️" : "🌙"}
          </Button>
          <Button size="icon" variant="ghost" aria-label="Toggle fullscreen" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={handleManualSave} loading={saveFile.isPending}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1">
          <MonacoEditor
            language={languageForExtension(file?.extension ?? null)}
            theme={theme}
            value={content}
            onChange={handleChange}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              wordWrap: "on",
              folding: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        {showHistory && (
          <div className="w-64 overflow-y-auto border-l border-border-subtle bg-bg-surface p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Version History</p>
            {versions?.length === 0 && <p className="text-xs text-text-secondary">No versions yet.</p>}
            <div className="space-y-2">
              {versions?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setContent(v.content ?? "")}
                  className="block w-full rounded-md border border-border-subtle p-2 text-left text-xs hover:bg-bg-secondary"
                >
                  <p className="font-medium">{v.users?.full_name ?? "Unknown"}</p>
                  <p className="text-text-muted">{formatDistanceToNow(new Date(v.created_at))} ago</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fullscreen) return editorPane;

  return (
    <AppLayout title="Code Editor" subtitle={file?.name} actions={<Button size="sm" variant="secondary"><Download className="h-4 w-4" /> Download</Button>}>
      {editorPane}
    </AppLayout>
  );
}
