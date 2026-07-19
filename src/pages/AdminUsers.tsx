import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTeamUsers, useUpdateUserRole, useRemoveUser } from "@/hooks/useAdmin";
import { ShieldCheck, User, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function AdminUsers() {
  const { data: users, isLoading } = useTeamUsers();
  const updateRole = useUpdateUserRole();
  const removeUser = useRemoveUser();
  const currentUser = useAuthStore((s) => s.user);

  return (
    <AppLayout title="User Management" subtitle="Admin only — manage roles and team access.">
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
