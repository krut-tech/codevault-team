import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { Star, Folder, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const { data: favorites, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const navigate = useNavigate();

  return (
    <AppLayout title="Favorites" subtitle="Your pinned folders and files, for quick access.">
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && favorites?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">No favorites yet — star a folder or file to pin it here.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites?.map((f: any) => {
          const item = f.folders ?? f.files;
          if (!item) return null;
          const isFolder = !!f.folders;
          return (
            <Card key={f.id} className="group relative flex cursor-pointer items-center gap-3 p-4" onClick={() => navigate(isFolder ? `/folders/${item.id}` : `/editor/${item.id}`)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
                {isFolder ? <Folder className="h-4 w-4 text-white" /> : <FileText className="h-4 w-4 text-white" />}
              </div>
              <p className="flex-1 truncate text-sm font-medium">{item.name}</p>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate({ folderId: f.folder_id, fileId: f.file_id, isFavorited: true, favoriteId: f.id }); }}
                aria-label="Remove from favorites"
              >
                <Star className="h-4 w-4 fill-warning text-warning" />
              </button>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
