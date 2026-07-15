import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useLanguages } from "@/hooks/useLanguages";
import { FolderKanban, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { data: languages } = useLanguages();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState<string>("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined, languageId: languageId || null },
      { onSuccess: () => { setName(""); setDescription(""); setLanguageId(""); setShowForm(false); } }
    );
  }

  return (
    <AppLayout
      title="Projects"
      subtitle="High-level projects your team is working on."
      actions={<Button size="sm" onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" /> New Project</Button>}
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" autoFocus />
              <select
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value)}
                className="rounded-md border border-border-subtle bg-bg-surface px-3 text-sm"
              >
                <option value="">No language</option>
                {languages?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <Input placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={createProject.isPending}>Create Project</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </Card>
        </form>
      )}

      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && projects?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">No projects yet — create your first one above.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <Card key={p.id} className="group relative p-5">
            <button
              onClick={() => deleteProject.mutate(p.id)}
              className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Delete project ${p.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
            </button>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold">{p.name}</p>
            {p.description && <p className="mt-1 text-sm text-text-secondary">{p.description}</p>}
            <div className="mt-3 flex items-center justify-between">
              {p.languages && <Badge variant="brand">{p.languages.name}</Badge>}
              <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(p.updated_at))} ago</span>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
