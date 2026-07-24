import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTeamUsers, useUpdateUserRole, useRemoveUser, useAddTeamMember } from "@/hooks/useAdmin";
import { ShieldCheck, User, Trash2, UserPlus, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useState } from "react";
import type { Role } from "@/types";

function AddUserPanel() {
  const addUser = useAddTeamMember();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setEmail("");
    setFullName("");
    setRole("user");
    setCreated(null);
    setCopied(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addUser.mutate(
      { email, fullName, role },
      {
        onSuccess: (data) => {
          toast.success(`${fullName} added to the team`);
          setCreated({ email: data.email, password: data.password });
        },
        onError: (err) => toast.error(`Failed to add user: ${err.message}`),
      }
    );
  }

  if (!open) {
    return (
      <Button className="mb-4" onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    );
  }

  return (
    <Card className="mb-4 p-5">
      {created ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-primary">
            Account created. Share this temporary password with them directly — it won't be shown again.
          </p>
          <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-secondary px-4 py-3">
            <div className="text-sm">
              <p className="text-text-secondary">{created.email}</p>
              <p className="font-mono font-medium">{created.password}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(created.password);
                setCopied(true);
                toast.success("Password copied");
              }}
            >
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              Copy
            </Button>
          </div>
          <p className="text-xs text-text-secondary">
            They can sign in right away at /login, then change their password from Profile.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Done
            </Button>
            <Button variant="ghost" onClick={reset}>
              Add another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">Role:</span>
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`rounded-md px-3 py-1 ${role === "user" ? "bg-brand-gradient text-white" : "bg-bg-secondary"}`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`rounded-md px-3 py-1 ${role === "admin" ? "bg-brand-gradient text-white" : "bg-bg-secondary"}`}
            >
              Admin
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            A random temporary password will be generated — no email step, no signup link needed.
          </p>
          <div className="flex gap-2">
            <Button type="submit" loading={addUser.isPending}>
              Create Account
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function AdminUsers() {
  const { data: users, isLoading } = useTeamUsers();
  const updateRole = useUpdateUserRole();
  const removeUser = useRemoveUser();
  const currentUser = useAuthStore((s) => s.user);

  return (
    <AppLayout title="User Management" subtitle="Admin only — manage roles and team access.">
      <AddUserPanel />
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      <div className="space-y-3">
        {users?.map((u) => (
          <Card key={u.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand-gradient" />
              )}
             <div>
                <p className="text-sm font-medium">{u.full_name}</p>
                <p className="text-xs text-text-secondary">{u.email}</p>
                <p className="text-xs text-text-muted">
                  {u.last_sign_in_at ? `Last active ${formatDistanceToNow(new Date(u.last_sign_in_at))} ago` : "Never logged in"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={u.role === "admin" ? "brand" : "default"}>
                {u.role === "admin" ? <ShieldCheck className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                {u.role}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                disabled={u.id === currentUser?.id}
                onClick={() =>
                  updateRole.mutate(
                    { id: u.id, role: u.role === "admin" ? "user" : "admin" },
                    { onSuccess: () => toast.success("Role updated") }
                  )
                }
              >
                Make {u.role === "admin" ? "User" : "Admin"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${u.full_name}`}
                disabled={u.id === currentUser?.id}
                onClick={() => {
                  if (!window.confirm(`Remove ${u.full_name} from the team? This revokes their access immediately and cannot be undone.`)) {
                    return;
                  }
                  removeUser.mutate(u.id, {
                    onSuccess: () => toast.success(`${u.full_name} removed`),
                    onError: (err) => toast.error(`Failed to remove ${u.full_name}: ${err.message}`),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
