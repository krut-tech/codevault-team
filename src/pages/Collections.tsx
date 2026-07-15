import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/useCollections";
import { Bookmark, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Collections() {
  const { data: collections, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  return (
    <AppLayout
      title="Collections"
      subtitle="Group related folders across languages and projects."
      actions={<Button size="sm" onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" /> New Collection</Button>}
    >
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createCollection.mutate({ name: name.trim() }, { onSuccess: () => { setName(""); setShowForm(false); } });
          }}
          className="mb-6"
        >
          <Card className="flex items-center gap-3 p-4">
            <Input placeholder="Collection name (e.g. ERP)" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" autoFocus />
            <Button type="submit" size="sm" loading={createCollection.isPending}>Create</Button>
            <Button type="button" size="icon" variant="ghost" aria-label="Close form" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </Card>
        </form>
      )}

      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && collections?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">No collections yet. Create one to group folders together.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {collections?.map((c) => (
          <Card key={c.id} className="group relative cursor-pointer p-5" onClick={() => navigate(`/collections/${c.id}`)}>
            <button
              onClick={(e) => { e.stopPropagation(); deleteCollection.mutate(c.id); }}
              className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
            </button>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `${c.color}22` }}>
              <Bookmark className="h-5 w-5" style={{ color: c.color ?? "#6366F1" }} />
            </div>
            <p className="font-semibold">{c.name}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
