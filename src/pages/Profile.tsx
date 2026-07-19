import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, file, { cacheControl: "3600", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      setUser({ ...user, avatar_url: avatarUrl });
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload picture");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <AppLayout title="Profile" subtitle="Manage your account details.">
      <Card className="max-w-lg p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="group relative h-16 w-16 flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-brand-gradient" />
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile picture"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-semibold">{user?.full_name}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-1 text-xs font-medium text-brand hover:underline disabled:opacity-60"
            >
              {uploadingAvatar ? "Uploading…" : "Change picture"}
            </button>
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
