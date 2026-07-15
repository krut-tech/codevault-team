import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function AdminSettings() {
  const { data: siteName } = useSetting<string>("site_name");
  const { data: retentionDays } = useSetting<number>("recycle_bin_retention_days");
  const updateSetting = useUpdateSetting();

  const [name, setName] = useState("CodeVault Team");
  const [retention, setRetention] = useState(30);

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

  return (
    <AppLayout title="System Settings" subtitle="Admin only — vault-wide configuration.">
      <Card className="max-w-lg space-y-5 p-6">
        <div className="mb-2 flex items-center gap-2 text-text-secondary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Admin Only</span>
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
