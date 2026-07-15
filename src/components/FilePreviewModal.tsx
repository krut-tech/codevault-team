import { X, Download, Star, FileText } from "lucide-react";
import { useFileSignedUrl } from "@/hooks/useFileUrl";
import { CommentThread } from "@/components/CommentThread";
import { Button } from "@/components/ui/Button";
import type { FileRow } from "@/types";
import { useEffect } from "react";
import { useDownloadFile } from "@/hooks/useFileUpload";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const TEXT_EXT = ["js", "jsx", "ts", "tsx", "py", "php", "java", "c", "cpp", "cs", "html", "css", "json", "md", "txt", "sql", "go", "rs", "yml", "yaml"];

export function FilePreviewModal({ file, onClose }: { file: FileRow; onClose: () => void }) {
  const { data: url } = useFileSignedUrl(file.storage_path);
  const downloadFile = useDownloadFile();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const fav = favorites?.find((f: any) => f.file_id === file.id);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ext = (file.extension ?? "").toLowerCase();
  const isImage = IMAGE_EXT.includes(ext);
  const isPdf = ext === "pdf";
  const isText = TEXT_EXT.includes(ext) && file.content !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Preview ${file.name}`}>
      <div
        className="flex h-[85vh] w-full max-w-5xl overflow-hidden rounded-xl bg-bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-semibold">{file.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle favorite"
                onClick={() => toggleFavorite.mutate({ fileId: file.id, isFavorited: !!fav, favoriteId: fav?.id })}
              >
                <Star className={`h-4 w-4 ${fav ? "fill-warning text-warning" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Download file" onClick={() => downloadFile.mutate({ storagePath: file.storage_path, name: file.name })}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Close preview" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-bg-secondary p-6">
            {isImage && url && <img src={url} alt={file.name} className="mx-auto max-h-full rounded-lg shadow-card" />}
            {isPdf && url && <iframe title={file.name} src={url} className="h-full w-full rounded-lg" />}
            {isText && (
              <pre className="whitespace-pre-wrap rounded-lg bg-bg-surface p-4 font-mono text-xs leading-relaxed">
                {file.content}
              </pre>
            )}
            {!isImage && !isPdf && !isText && (
              <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
                <FileText className="mb-3 h-10 w-10" />
                <p>No inline preview available for this file type.</p>
                <p className="text-xs text-text-muted">Download to view it locally.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-72 border-l border-border-subtle">
          <CommentThread fileId={file.id} />
        </div>
      </div>
    </div>
  );
}
