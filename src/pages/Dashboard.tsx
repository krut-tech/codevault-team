import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Code2, FolderKanban, Files, HardDrive, Star, Clock, Plus, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useFolderContents } from "@/hooks/useFolders";
import { useLanguages } from "@/hooks/useLanguages";
import { useStorageUsed } from "@/hooks/useStorageUsed";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useFolderContents(null);
  const { data: languages } = useLanguages();
  const { data: storageBytes } = useStorageUsed();
  const { data: favorites } = useFavorites();
  const navigate = useNavigate();

  const widgets = [
    { label: "Root Folders", value: data?.folders.length ?? "—", icon: FolderKanban },
    { label: "Root Files", value: data?.files.length ?? "—", icon: Files },
    { label: "Languages", value: languages?.length ?? "—", icon: Code2 },
    { label: "Storage Used", value: storageBytes !== undefined ? formatBytes(storageBytes) : "—", icon: HardDrive },
  ];

  return (
    <AppLayout title={`Welcome back, ${user?.full_name?.split(" ")[0] ?? "there"} 👋`} subtitle="Here's what's happening in the vault today.">
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {widgets.map((w, i) => (
            <motion.div key={w.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{w.label}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                    <w.icon className="h-4 w-4 text-brand" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold">{w.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Recent Folders</h2>
              <Button size="sm" variant="ghost" onClick={() => navigate("/projects")}>
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </div>
            {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
            {!isLoading && data?.folders.length === 0 && (
              <p className="text-sm text-text-secondary">No folders yet — upload your first project to get started.</p>
            )}
            <div className="space-y-2">
              {data?.folders.slice(0, 6).map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/folders/${f.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
                      <FolderKanban className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-text-secondary">Updated {formatDistanceToNow(new Date(f.updated_at))} ago</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" aria-label="More options"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <h2 className="font-semibold">Favorites</h2>
            </div>
            {favorites?.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-text-secondary"><Clock className="h-3.5 w-3.5" /> No favorites pinned yet.</p>
            )}
            <div className="space-y-2">
              {favorites?.slice(0, 5).map((f: any) => {
                const item = f.folders ?? f.files;
                if (!item) return null;
                const isFolder = !!f.folders;
                return (
                  <div
                    key={f.id}
                    onClick={() => navigate(isFolder ? `/folders/${item.id}` : `/editor/${item.id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-bg-secondary"
                  >
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="truncate">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
