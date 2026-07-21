import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguages, useCreateLanguage, useDeleteLanguage } from "@/hooks/useLanguages";
import { Plus, Code2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PRESET_COLORS = ["#6366F1", "#A855F7", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6"];

export default function Languages() {
  const { data: languages, isLoading } = useLanguages();
  const createLanguage = useCreateLanguage();
  const deleteLanguage = useDeleteLanguage();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createLanguage.mutate(
      { name: name.trim(), color },
      { onSuccess: () => { setName(""); setShowForm(false); } }
    );
  }

  return (
    <AppLayout
      title="Languages"
      subtitle="Every technology your team works with, in one place."
      actions={
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Add Language
        </Button>
      }
    >
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-6 overflow-hidden"
          >
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <Input
                placeholder="Language name (e.g. Rust)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xs"
                autoFocus
              />
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full ring-offset-2 ring-offset-bg-surface transition-all"
                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }}
                  />
                ))}
              </div>
              <Button type="submit" size="sm" loading={createLanguage.isPending}>Create</Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </Card>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading && <p className="text-sm text-text-secondary">Loading languages…</p>}
      {!isLoading && languages?.length === 0 && (
        <p className="text-sm text-text-secondary">No languages yet. Add your first one above.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {languages?.map((lang) => (
          <Card key={lang.id} className="group relative cursor-pointer p-5" onClick={() => navigate(`/languages/${lang.id}`)}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete "${lang.name}"? This can't be undone.`)) return;
                deleteLanguage.mutate(lang.id, {
                  onError: (err: any) => {
                    const isFkViolation = err?.code === "23503" || String(err?.message).includes("foreign key");
                    toast.error(
                      isFkViolation
                        ? `Can't delete "${lang.name}" — files or folders are still tagged with it. Move or delete those first.`
                        : `Failed to delete "${lang.name}": ${err?.message ?? "Unknown error"}`
                    );
                  },
                });
              }}
              className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
            </button>
            <div
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: `${lang.color}22` }}
            >
              <Code2 className="h-5 w-5" style={{ color: lang.color ?? "#6366F1" }} />
            </div>
            <p className="font-semibold">{lang.name}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}