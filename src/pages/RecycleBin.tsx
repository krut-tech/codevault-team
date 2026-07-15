import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRecycleBin, useRestoreFolder, useRestoreFile } from "@/hooks/useFolders";
import { Trash2, RotateCcw, Folder, FileText } from "lucide-react";

export default function RecycleBin() {
  const { data, isLoading } = useRecycleBin();
  const restoreFolder = useRestoreFolder();
  const restoreFile = useRestoreFile();

  return (
    <AppLayout title="Recycle Bin" subtitle="Deleted items are kept here until restored or auto-purged.">
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && data?.folders.length === 0 && data?.files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Trash2 className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">Recycle bin is empty.</p>
        </div>
      )}
      <div className="space-y-2">
        {data?.folders.map((f) => (
          <Card key={f.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4 text-text-muted" />
              <span className="text-sm">{f.name}</span>
            </div>
            <Button size="sm" variant="secondary" loading={restoreFolder.isPending} onClick={() => restoreFolder.mutate(f.id)}>
              <RotateCcw className="h-3.5 w-3.5" /> Restore
            </Button>
          </Card>
        ))}
        {data?.files.map((f) => (
          <Card key={f.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-text-muted" />
              <span className="text-sm">{f.name}</span>
            </div>
            <Button size="sm" variant="secondary" loading={restoreFile.isPending} onClick={() => restoreFile.mutate(f.id)}>
              <RotateCcw className="h-3.5 w-3.5" /> Restore
            </Button>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
