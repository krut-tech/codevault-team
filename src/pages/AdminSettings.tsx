import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ShieldCheck, Code2 } from "lucide-react";

const LOGO_BUCKET = "avatars";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

export default function AdminSettings() {
  const { data: siteName } = useSetting<string>("site_name");
  const { data: retentionDays } = useSetting<number>("recycle_bin_retention_days");
  const { data: logoUrl } = useSetting<string>("logo_url");
  const updateSetting = useUpdateSetting();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("CodeVault Team");
  const [retention, setRetention] = useState(30);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (siteName) setName(siteName); }, [siteName]);
  useEffect(() => { if (retentionDays) setRetention(retentionDays); }, [retentionDays]);

  function handleSave() {
    Promise.all([
      updateSetting.mutateAsync({ key: "site_name", value: name }),
      updateSetting.mutateAsync({ key: "recycle_bin_retention_days", value: retention }),
    ])
      .then(() => toast.success("Settings saved"))
      .catch(() => toast.error("Failed to save settings"));
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const storagePath = `${user.id}/workspace-logo-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(storagePath, file, { cacheControl: "3600", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);
      await updateSetting.mutateAsync({ key: "logo_url", value: publicUrlData.publicUrl });
      toast.success("Logo updated for the whole team");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    await updateSetting.mutateAsync({ key: "logo_url", value: null });
    toast.success("Reverted to the default logo");
  }

  return (
    <AppLayout title="System Settings" subtitle="Admin only — vault-wide configuration.">
      <Card className="max-w-lg space-y-5 p-6">
        <div className="mb-2 flex items-center gap-2 text-text-secondary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Admin Only</span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Workspace Logo</label>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-gradient shadow-glow">
              {logoUrl ? (
                <img src={logoUrl} alt="Workspace logo" className="h-full w-full object-cover" />
              ) : (
                <Code2 className="h-6 w-6 text-white" />
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <Button
              size="sm"
              variant="secondary"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? "Uploading…" : "Change logo"}
            </Button>
            {logoUrl && (
              <Button size="sm" variant="ghost" onClick={handleRemoveLogo}>Reset to default</Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-text-muted">Shows up in the sidebar for every team member. Square images work best.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Vault Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Recycle Bin Auto-Purge (days)</label>
          <Input type="number" min={1} value={retention} onChange={(e) => setRetention(Number(e.target.value))} />
          <p className="mt-1 text-xs text-text-muted">Deleted items older than this are permanently purged. Requires a scheduled Supabase Edge Function (see Deployment Guide).</p>
        </div>
        <Button onClick={handleSave} loading={updateSetting.isPending}>Save Settings</Button>
      </Card>
    </AppLayout>
  );
}
