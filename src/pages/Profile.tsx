import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <AppLayout title="Profile" subtitle="Manage your account details.">
      <Card className="max-w-lg p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-gradient" />
          <div>
            <p className="font-semibold">{user?.full_name}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Role</label>
            <Input value={user?.role ?? ""} disabled />
          </div>
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </div>
        <div className="mt-6 border-t border-border-subtle pt-4">
          <Button variant="secondary" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
