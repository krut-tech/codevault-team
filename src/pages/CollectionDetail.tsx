import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { useCollectionFolders, useRemoveFolderFromCollection } from "@/hooks/useCollections";
import { useParams, useNavigate } from "react-router-dom";
import { Folder, X } from "lucide-react";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { data: folders, isLoading } = useCollectionFolders(collectionId!);
  const removeFolder = useRemoveFolderFromCollection();
  const navigate = useNavigate();

  return (
    <AppLayout title="Collection" subtitle="Folders grouped in this collection.">
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && folders?.length === 0 && <p className="text-sm text-text-secondary">No folders added to this collection yet — use "Add to Collection" from a folder's menu.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders?.map((f: any) => (
          <Card key={f.id} className="group relative flex cursor-pointer items-center gap-3 p-4" onClick={() => navigate(`/folders/${f.id}`)}>
            <Folder className="h-4 w-4 text-brand" />
            <span className="flex-1 truncate text-sm font-medium">{f.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeFolder.mutate({ collectionId: collectionId!, folderId: f.id }); }}
              aria-label={`Remove ${f.name} from collection`}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
            </button>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
