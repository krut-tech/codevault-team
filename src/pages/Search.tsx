import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useSearch } from "@/hooks/useSearch";
import { Search as SearchIcon, Folder, FileText } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get("q") ?? "");
  const { data, isFetching } = useSearch(q);

  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  return (
    <AppLayout title="Search" subtitle="Instant results across every language, folder, and file.">
      <Input
        icon={<SearchIcon className="h-4 w-4" />}
        placeholder="Search folders and files..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6 max-w-lg"
        autoFocus
      />

      {isFetching && <p className="text-sm text-text-secondary">Searching…</p>}
      {!isFetching && q.length > 1 && data?.folders.length === 0 && data?.files.length === 0 && (
        <p className="text-sm text-text-secondary">No results for "{q}".</p>
      )}

      <div className="space-y-2">
        {data?.folders.map((f) => (
          <Card key={f.id} className="flex cursor-pointer items-center gap-3 p-4" onClick={() => navigate(`/folders/${f.id}`)}>
            <Folder className="h-4 w-4 text-brand" />
            <span className="text-sm font-medium">{f.name}</span>
            <span className="ml-auto text-xs text-text-muted">Folder</span>
          </Card>
        ))}
        {data?.files.map((f) => (
          <Card key={f.id} className="flex cursor-pointer items-center gap-3 p-4" onClick={() => f.content !== null && navigate(`/editor/${f.id}`)}>
            <FileText className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium">{f.name}</span>
            <span className="ml-auto text-xs text-text-muted">{f.extension?.toUpperCase()}</span>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
