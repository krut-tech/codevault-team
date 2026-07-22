import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Folder, FileText, Upload, Plus, ChevronRight, Code2,
  MoreHorizontal, Download, Trash2, Edit3, Star, FileArchive, X, Tag as TagIcon, Eye, FolderUp, Bookmark, MessageSquare
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFolderContents, useCreateFolder, useSoftDeleteFolder, useRenameFolder, useLanguageRootContents } from "@/hooks/useFolders";
import { useFolderPath } from "@/hooks/useFolderPath";
import { useFileUpload, useDeleteFile, useDownloadFile, useRenameFile } from "@/hooks/useFileUpload";
import { useLanguage } from "@/hooks/useLanguages";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useCollections, useAddFolderToCollection } from "@/hooks/useCollections";
import { TagPicker } from "@/components/TagPicker";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { CommentThread } from "@/components/CommentThread";
import { useDropzone } from "react-dropzone";
import { useState, useCallback, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FileRow } from "@/types";

// Extend the file input element type to support the non-standard
// `webkitdirectory` attribute used for whole-folder uploads.
type DirInputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

/**
 * Same browsing/upload/download experience as FolderBrowser, but scoped
 * to a single language: everything created here (folders, files, and
 * whatever ZIPs/folder-uploads expand into) is tagged with language_id,
 * and the root view only ever shows content that belongs to this
 * language — nothing from the shared/global Files area leaks in, and
 * nothing uploaded here leaks out.
 */
export default function LanguageDetail() {
  const { languageId, folderId } = useParams<{ languageId: string; folderId?: string }>();
  const currentFolderId = folderId ?? null;
  const navigate = useNavigate();

  const { data: language, isLoading: languageLoading } = useLanguage(languageId ?? null);

  // At the language root there's no real folder row to query by id, so we
  // use a dedicated language-scoped query. Once inside a subfolder, the
  // regular folder-contents query is correct on its own — a subfolder is
  // only reachable through this language's tree in the first place.
  const rootQuery = useLanguageRootContents(currentFolderId ? null : languageId ?? null);
  const nestedQuery = useFolderContents(currentFolderId);
  const { data, isLoading } = currentFolderId ? nestedQuery : rootQuery;

  const { data: path } = useFolderPath(currentFolderId);
  const createFolder = useCreateFolder();
  const deleteFolder = useSoftDeleteFolder();
  const renameFolder = useRenameFolder();
  const renameFile = useRenameFile();
  const uploadFiles = useFileUpload(currentFolderId, languageId ?? null);
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();
  const { data: collections } = useCollections();
  const addFolderToCollection = useAddFolderToCollection();

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingType, setRenamingType] = useState<"folder" | "file" | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tagPickerFolderId, setTagPickerFolderId] = useState<string | null>(null);
  const [tagPickerFileId, setTagPickerFileId] = useState<string | null>(null);
  const [collectionPickerFolderId, setCollectionPickerFolderId] = useState<string | null>(null);
  const [commentsFolderId, setCommentsFolderId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRow | null>(null);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      toast.promise(uploadFiles.mutateAsync(accepted), {
        loading: `Uploading ${accepted.length} item(s)...`,
        success: "Upload complete",
        error: "Upload failed",
      });
    },
    [uploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim() || !languageId) return;
    createFolder.mutate(
      { name: newFolderName.trim(), parentFolderId: currentFolderId, languageId },
      { onSuccess: () => { setNewFolderName(""); setShowNewFolder(false); } }
    );
  }

  function startRename(id: string, currentName: string, type: "folder" | "file") {
    setRenamingId(id);
    setRenamingType(type);
    setRenameValue(currentName);
    setOpenMenuId(null);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      if (renamingType === "folder") renameFolder.mutate({ id: renamingId, name: renameValue.trim() });
      else if (renamingType === "file") renameFile.mutate({ id: renamingId, name: renameValue.trim() });
    }
    setRenamingId(null);
    setRenamingType(null);
  }

  // close context menu on outside click
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const langColor = language?.color ?? "#6366F1";

  return (
    <AppLayout
      title={language?.name ?? (languageLoading ? "Loading…" : "Language")}
      subtitle={language ? `Files and folders for ${language.name} — kept separate from other languages.` : undefined}
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            {...({ webkitdirectory: "true", directory: "true" } as DirInputProps)}
            onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
          />
          <Button size="sm" variant="secondary" onClick={() => folderInputRef.current?.click()}>
            <FolderUp className="h-4 w-4" /> Upload Folder
          </Button>
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
          <Button size="sm" onClick={() => setShowNewFolder((s) => !s)}>
            <Plus className="h-4 w-4" /> New Folder
          </Button>
        </>
      }
    >
      {/* Breadcrumbs — Home here means this language's root, not the global Files area */}
      <div className="mb-5 flex items-center gap-1.5 text-sm text-text-secondary">
        <Link to={`/languages/${languageId}`} className="flex items-center gap-1 hover:text-text-primary">
          <span
            className="flex h-4 w-4 items-center justify-center rounded"
            style={{ background: `${langColor}22` }}
          >
            <Code2 className="h-3 w-3" style={{ color: langColor }} />
          </span>
          {language?.name ?? "Language"}
        </Link>
        {path?.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/languages/${languageId}/folders/${p.id}`} className="hover:text-text-primary">{p.name}</Link>
          </span>
        ))}
      </div>

      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="mb-5">
          <Card className="flex items-center gap-3 p-3">
            <Folder className="h-4 w-4 text-brand" />
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              className="max-w-xs"
            />
            <Button type="submit" size="sm" loading={createFolder.isPending}>Create</Button>
            <Button type="button" size="icon" variant="ghost" aria-label="Cancel new folder" onClick={() => setShowNewFolder(false)}>
              <X className="h-4 w-4" />
            </Button>
          </Card>
        </form>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "relative min-h-[50vh] rounded-xl border-2 border-dashed border-transparent transition-colors",
          isDragActive && "border-brand bg-brand/5"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-bg-surface/90 backdrop-blur-sm">
            <div className="text-center">
              <FileArchive className="mx-auto mb-2 h-10 w-10 text-brand" />
              <p className="font-semibold text-brand">Drop files or ZIP archives here</p>
              <p className="text-xs text-text-secondary">ZIPs are extracted automatically</p>
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
        {!isLoading && data?.folders.length === 0 && data?.files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Folder className="mb-3 h-12 w-12 text-text-muted" />
            <p className="font-medium text-text-secondary">
              {currentFolderId ? "This folder is empty" : `No ${language?.name ?? ""} files yet`}
            </p>
            <p className="text-sm text-text-muted">Drag files here, or use Upload / New Folder above.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.folders.map((f) => (
<Card key={f.id} className={cn("group relative p-5", openMenuId === f.id && "z-20")}>              {renamingId === f.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === "Enter" && commitRename()}
                  className="mb-2"
                />
              ) : (
                <div
                  className="flex cursor-pointer items-start gap-3"
                  onClick={() => navigate(`/languages/${languageId}/folders/${f.id}`)}
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
                    <Folder className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{f.name}</p>
                    <p className="text-xs text-text-secondary">Updated {formatDistanceToNow(new Date(f.updated_at))} ago</p>
                  </div>
                </div>
              )}

              <CardMenu
                open={openMenuId === f.id}
                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === f.id ? null : f.id); }}
                items={[
                  { label: "Rename", icon: Edit3, onClick: () => startRename(f.id, f.name, "folder") },
                  { label: "Tags", icon: TagIcon, onClick: () => { setTagPickerFolderId(f.id); setOpenMenuId(null); } },
                  { label: "Add to Collection", icon: Bookmark, onClick: () => { setCollectionPickerFolderId(f.id); setOpenMenuId(null); } },
                  { label: "Comments", icon: MessageSquare, onClick: () => { setCommentsFolderId(f.id); setOpenMenuId(null); } },
                  {
                    label: favorites?.some((fv: any) => fv.folder_id === f.id) ? "Unfavorite" : "Favorite",
                    icon: Star,
                    onClick: () => {
                      const fav = favorites?.find((fv: any) => fv.folder_id === f.id);
                      toggleFavorite.mutate({ folderId: f.id, isFavorited: !!fav, favoriteId: fav?.id });
                    },
                  },
                  { label: "Delete", icon: Trash2, danger: true, onClick: () => deleteFolder.mutate(f.id) },
                ]}
              />
              {tagPickerFolderId === f.id && <TagPicker folderId={f.id} onClose={() => setTagPickerFolderId(null)} />}
              {collectionPickerFolderId === f.id && (
                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-6 z-40 w-56 rounded-lg border border-border-subtle bg-bg-surface p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Add to Collection</p>
                  {collections?.length === 0 && <p className="text-xs text-text-secondary">No collections yet — create one first.</p>}
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {collections?.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          addFolderToCollection.mutate(
                            { collectionId: c.id, folderId: f.id },
                            { onSuccess: () => toast.success(`Added to ${c.name}`) }
                          );
                          setCollectionPickerFolderId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg-secondary"
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color ?? "#6366F1" }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCollectionPickerFolderId(null)} className="mt-2 w-full text-center text-xs text-text-muted hover:text-text-primary">Close</button>
                </div>
              )}
            </Card>
          ))}

          {data?.files.map((file) => (
<Card key={file.id} className={cn("group relative cursor-pointer p-5", openMenuId === file.id && "z-20")} onClick={() => renamingId !== file.id && setPreviewFile(file)}>              {renamingId === file.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === "Enter" && commitRename()}
                  onClick={(e) => e.stopPropagation()}
                  className="mb-2"
                />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                    <FileText className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{file.name}</p>
                    <p className="text-xs text-text-secondary">
                      {file.extension?.toUpperCase()} · {formatDistanceToNow(new Date(file.updated_at))} ago
                    </p>
                    {file.extension && <Badge variant="brand" className="mt-2">{file.extension}</Badge>}
                  </div>
                </div>
              )}

              <CardMenu
                open={openMenuId === file.id}
                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === file.id ? null : file.id); }}
                items={[
                  { label: "Preview", icon: Eye, onClick: () => setPreviewFile(file) },
                  { label: "Rename", icon: Edit3, onClick: () => startRename(file.id, file.name, "file") },
                  { label: "Tags", icon: TagIcon, onClick: () => { setTagPickerFileId(file.id); setOpenMenuId(null); } },
                  ...(file.content !== null
                    ? [{ label: "Edit", icon: Edit3, onClick: () => navigate(`/editor/${file.id}`) }]
                    : []),
                  { label: "Download", icon: Download, onClick: () => downloadFile.mutate({ storagePath: file.storage_path, name: file.name }) },
                  {
                    label: favorites?.some((fv: any) => fv.file_id === file.id) ? "Unfavorite" : "Favorite",
                    icon: Star,
                    onClick: () => {
                      const fav = favorites?.find((fv: any) => fv.file_id === file.id);
                      toggleFavorite.mutate({ fileId: file.id, isFavorited: !!fav, favoriteId: fav?.id });
                    },
                  },
                  { label: "Delete", icon: Trash2, danger: true, onClick: () => deleteFile.mutate(file.id) },
                ]}
              />
              {tagPickerFileId === file.id && <TagPicker fileId={file.id} onClose={() => setTagPickerFileId(null)} />}
            </Card>
          ))}
        </div>
      </div>

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {commentsFolderId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setCommentsFolderId(null)}>
          <div className="h-full w-80 bg-bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <span className="text-sm font-semibold">Folder Comments</span>
              <button onClick={() => setCommentsFolderId(null)} aria-label="Close comments"><X className="h-4 w-4" /></button>
            </div>
            <div className="h-[calc(100%-49px)]">
              <CommentThread folderId={commentsFolderId} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CardMenu({
  open,
  onToggle,
  items,
}: {
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  items: { label: string; icon: any; onClick: () => void; danger?: boolean }[];
}) {
  return (
    <div className="absolute right-3 top-3">
      <button onClick={onToggle} aria-label="Open item menu" aria-haspopup="menu" aria-expanded={open} className="opacity-0 transition-opacity group-hover:opacity-100">
        <MoreHorizontal className="h-4 w-4 text-text-muted hover:text-text-primary" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-6 z-30 w-40 overflow-hidden rounded-lg border border-border-subtle bg-bg-surface shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-secondary",
                item.danger ? "text-danger" : "text-text-primary"
              )}
            >
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
