import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <AppLayout title="Notifications" subtitle="Realtime updates from across the team.">
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && notifications?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bell className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">You're all caught up.</p>
        </div>
      )}
      <div className="space-y-2">
        {notifications?.map((n) => (
          <Card key={n.id} className={cn("flex items-center justify-between p-4", !n.is_read && "border-brand/40 bg-brand/5")}>
            <div>
              <p className="text-sm font-medium">{n.message}</p>
              <p className="text-xs text-text-muted">{formatDistanceToNow(new Date(n.created_at))} ago</p>
            </div>
            {!n.is_read && (
              <Button size="icon" variant="ghost" aria-label="Mark as read" onClick={() => markRead.mutate(n.id)}>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
