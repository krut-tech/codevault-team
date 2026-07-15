import {
  useTags, useCreateTag,
  useFolderTags, useAssignTagToFolder, useRemoveTagFromFolder,
  useFileTags, useAssignTagToFile, useRemoveTagFromFile,
} from "@/hooks/useTags";
import { useState } from "react";
import { Plus, Check } from "lucide-react";

export function TagPicker({
  folderId,
  fileId,
  onClose,
}: {
  folderId?: string;
  fileId?: string;
  onClose: () => void;
}) {
  const { data: allTags } = useTags();
  const { data: folderTags } = useFolderTags(folderId ?? "");
  const { data: fileTags } = useFileTags(fileId ?? "");
  const assignToFolder = useAssignTagToFolder();
  const removeFromFolder = useRemoveTagFromFolder();
  const assignToFile = useAssignTagToFile();
  const removeFromFile = useRemoveTagFromFile();
  const createTag = useCreateTag();
  const [newTag, setNewTag] = useState("");

  const activeTags = folderId ? folderTags : fileTags;
  const activeIds = new Set(activeTags?.map((t) => t.id));

  function toggle(tagId: string, active: boolean) {
    if (folderId) {
      active ? removeFromFolder.mutate({ folderId, tagId }) : assignToFolder.mutate({ folderId, tagId });
    } else if (fileId) {
      active ? removeFromFile.mutate({ fileId, tagId }) : assignToFile.mutate({ fileId, tagId });
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-6 z-40 w-56 rounded-lg border border-border-subtle bg-bg-surface p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Tags</p>
      <div className="mb-2 max-h-40 space-y-1 overflow-y-auto">
        {allTags?.map((tag) => {
          const active = activeIds.has(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggle(tag.id, active)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg-secondary"
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </span>
              {active && <Check className="h-3.5 w-3.5 text-brand" />}
            </button>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTag.trim()) return;
          createTag.mutate({ name: newTag.trim() }, { onSuccess: () => setNewTag("") });
        }}
        className="flex items-center gap-1 border-t border-border-subtle pt-2"
      >
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="New tag..."
          className="w-full rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button type="submit" aria-label="Create tag" className="rounded-md p-1 hover:bg-bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
      </form>
      <button onClick={onClose} className="mt-2 w-full text-center text-xs text-text-muted hover:text-text-primary">Close</button>
    </div>
  );
}
