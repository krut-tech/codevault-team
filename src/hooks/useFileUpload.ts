import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/hooks/useActivityLog";
import { notifyTeam } from "@/hooks/useTeamNotify";
import JSZip from "jszip";
import { toast } from "sonner";

const BUCKET = "codevault-files";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per file
const MAX_ZIP_ENTRIES = 2000; // guard against zip bombs / pathological archives

export function extOf(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function sanitizeFileName(name: string) {
  return name.replace(/[/\\]/g, "_");
}

async function ensureFolderPath(
  parts: string[],
  rootFolderId: string | null,
  userId: string | undefined,
  cache: Map<string, string>,
  languageId: string | null = null
): Promise<string | null> {
  let currentParentId: string | null = rootFolderId;
  let pathKey = rootFolderId ?? "ROOT";
  for (const part of parts) {
    pathKey += `/${part}`;
    if (cache.has(pathKey)) {
      currentParentId = cache.get(pathKey)!;
      continue;
    }
    let existingQuery = supabase.from("folders").select("id").eq("name", part).eq("is_deleted", false);
    existingQuery = currentParentId ? existingQuery.eq("parent_folder_id", currentParentId) : existingQuery.is("parent_folder_id", null);
    if (languageId) existingQuery = existingQuery.eq("language_id", languageId);
    const { data: existing } = await existingQuery.maybeSingle();

    let resolvedId: string;
    if (existing) {
      resolvedId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("folders")
        .insert({ name: part, parent_folder_id: currentParentId, language_id: languageId, created_by: userId })
        .select("id")
        .single();
      if (error) throw error;
      resolvedId = created.id;
    }
    currentParentId = resolvedId;
    cache.set(pathKey, resolvedId);
  }
  return currentParentId;
}

/**
 * Uploads one or more files to a target folder.
 * If a file is a .zip, it is extracted client-side and every entry
 * is re-created as nested folders/files automatically.
 */
export function useFileUpload(targetFolderId: string | null, languageId: string | null = null) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (fileList: File[]) => {
      const folderCache = new Map<string, string>();

      for (const file of fileList) {
        const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;

        if (extOf(file.name) === "zip") {
          const zip = await JSZip.loadAsync(file);
          const rootName = file.name.replace(/\.zip$/i, "");
          const { data: zipRootFolder, error: rootErr } = await supabase
            .from("folders")
            .insert({ name: rootName, parent_folder_id: targetFolderId, language_id: languageId, created_by: user?.id })
            .select("id")
            .single();
          if (rootErr) throw rootErr;

          const entries = Object.values(zip.files);
          if (entries.length > MAX_ZIP_ENTRIES) {
            throw new Error(
              `"${file.name}" contains ${entries.length} entries, which exceeds the ${MAX_ZIP_ENTRIES}-entry limit per upload.`
            );
          }
          for (const entry of entries) {
            if (entry.dir) continue;
            const pathParts = entry.name.split("/").filter(Boolean);
            const fileName = pathParts.pop()!;
            const folderId = await ensureFolderPath(pathParts, zipRootFolder.id, user?.id, folderCache, languageId);
            const blob = await entry.async("blob");
            await uploadSingleFile(new File([blob], fileName), folderId, user?.id, languageId);
          }
          await logActivity("folder.created", "folder", zipRootFolder.id, { source: "zip", name: rootName });
        } else if (relPath && relPath.includes("/")) {
          // Whole-folder upload (webkitdirectory): preserve the relative folder structure
          const pathParts = relPath.split("/").filter(Boolean);
          pathParts.pop(); // drop the file name itself, keep only folder segments
          const resolvedFolderId = await ensureFolderPath(pathParts, targetFolderId, user?.id, folderCache, languageId);
          await uploadSingleFile(file, resolvedFolderId, user?.id, languageId);
        } else {
          await uploadSingleFile(file, targetFolderId, user?.id, languageId);
        }
      }
    },
    onSuccess: (_data, fileList) => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
      toast.success("Upload complete");
      notifyTeam(
        `${useAuthStore.getState().user?.full_name ?? "Someone"} uploaded ${fileList.length} item(s)`,
        "file.uploaded"
      );
    },
    onError: (err: Error) => toast.error(`Upload failed: ${err.message}`),
  });
}

async function uploadSingleFile(file: File, folderId: string | null, userId: string | undefined, languageId: string | null = null) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB, which exceeds the 50MB per-file limit.`);
  }
  // Strip path separators from the filename before it's interpolated into
  // the storage path, so a crafted name (e.g. containing "/" or "..")
  // can't land the object outside the intended folder prefix.
  const safeName = sanitizeFileName(file.name);
  const storagePath = `${folderId ?? "root"}/${Date.now()}-${safeName}`;
  const { error: storageErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (storageErr) throw storageErr;

  let content: string | null = null;
  const textExts = ["js","ts","tsx","jsx","py","php","java","c","cpp","cs","html","css","json","md","txt","sql","go","rs","yml","yaml"];
  if (textExts.includes(extOf(file.name)) && file.size < 2_000_000) {
    content = await file.text();
  }

  const { data, error } = await supabase
    .from("files")
    .insert({
      name: file.name,
      folder_id: folderId,
      language_id: languageId,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      extension: extOf(file.name),
      content,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity("file.uploaded", "file", data.id, { name: file.name });
  return data;
}

export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("files").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logActivity("file.renamed", "file", id, { name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: file } = await supabase.from("files").select("name").eq("id", id).single();
      const { error } = await supabase
        .from("files")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity("file.deleted", "file", id, {});
      await notifyTeam(`${useAuthStore.getState().user?.full_name ?? "Someone"} deleted "${file?.name ?? ""}"`, "file.deleted", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({ storagePath, name }: { storagePath: string; name: string }) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoking immediately after click() can cancel the download in
      // Safari/WebKit before the browser has actually started reading the
      // blob. Defer it to the next tick instead.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
