import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSnippets, useCreateSnippet, useDeleteSnippet } from "@/hooks/useSnippets";
import { Plus, Code2, Trash2, X, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LANGS = ["javascript", "typescript", "python", "php", "java", "sql", "bash", "plaintext"];

export default function Snippets() {
  const { data: snippets, isLoading } = useSnippets();
  const createSnippet = useCreateSnippet();
  const deleteSnippet = useDeleteSnippet();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;
    createSnippet.mutate(
      { title: title.trim(), language, code },
      { onSuccess: () => { setTitle(""); setCode(""); setShowForm(false); } }
    );
  }

  return (
    <AppLayout
      title="Code Snippets"
      subtitle="Quick reusable code notes — no need to create a full file."
      actions={<Button size="sm" onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" /> New Snippet</Button>}
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6">
          <Card className="space-y-3 p-4">
            <div className="flex gap-3">
              <Input placeholder="Snippet title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" autoFocus />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-border-subtle bg-bg-surface px-3 text-sm"
              >
                {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code..."
              rows={6}
              className="w-full rounded-md border border-border-subtle bg-bg-surface p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={createSnippet.isPending}>Save Snippet</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </Card>
        </form>
      )}

      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && snippets?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Code2 className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">No snippets yet — save your first reusable code note.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {snippets?.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{s.title}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => { navigator.clipboard.writeText(s.code); toast.success("Copied"); }}>
                  <Copy className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
                </button>
                <button onClick={() => deleteSnippet.mutate(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
                </button>
              </div>
            </div>
            <pre className="max-h-40 overflow-auto rounded-md bg-bg-secondary p-3 font-mono text-xs">{s.code}</pre>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
