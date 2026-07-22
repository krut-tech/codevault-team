import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Code2, FolderKanban, Files, HardDrive, Star, Plus, MoreHorizontal, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFolderContents } from "@/hooks/useFolders";
import { useLanguages } from "@/hooks/useLanguages";
import { useStorageUsed } from "@/hooks/useStorageUsed";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/** Counts up to a numeric value on mount/update instead of popping in flat. */
function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useFolderContents(null);
  const { data: languages } = useLanguages();
  const { data: storageBytes } = useStorageUsed();
  const { data: favorites } = useFavorites();
  const navigate = useNavigate();

  const widgets = [
    { label: "Root Folders", value: data?.folders.length, icon: FolderKanban, tone: "brand" as const },
    { label: "Root Files", value: data?.files.length, icon: Files, tone: "info" as const },
    { label: "Languages", value: languages?.length, icon: Code2, tone: "warning" as const },
    {
      label: "Storage Used",
      value: storageBytes !== undefined ? formatBytes(storageBytes) : undefined,
      icon: HardDrive,
      tone: "danger" as const,
    },
  ];

  const toneClasses = {
    brand: "bg-brand/10 text-brand",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <AppLayout title={`Welcome back, ${user?.full_name?.split(" ")[0] ?? "there"} 👋`} subtitle="Here's what's happening in the vault today.">
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {widgets.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{w.label}</span>
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses[w.tone])}>
                    <w.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 font-display text-3xl font-bold">
                  {typeof w.value === "number" ? <AnimatedNumber value={w.value} /> : w.value ?? "—"}
                </p>
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
              {data?.folders.slice(0, 6).map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 4 }}
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
                </motion.div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <h2 className="font-semibold">Favorites</h2>
            </div>
            {favorites?.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-subtle py-8 text-center">
                <Sparkles className="h-5 w-5 text-text-muted" />
                <p className="text-sm text-text-secondary">No favorites pinned yet.</p>
                <p className="text-xs text-text-muted">Star a file or folder to find it here fast.</p>
              </div>
            )}
            <div className="space-y-2">
              {favorites?.slice(0, 5).map((f: any, i: number) => {
                const item = f.folders ?? f.files;
                if (!item) return null;
                const isFolder = !!f.folders;
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 3 }}
                    onClick={() => navigate(isFolder ? `/folders/${item.id}` : `/editor/${item.id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-bg-secondary"
                  >
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="truncate">{item.name}</span>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
