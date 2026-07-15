import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { formatDistanceToNow } from "date-fns";
import { ScrollText } from "lucide-react";

export default function AdminActivityLogs() {
  const { data: logs, isLoading } = useActivityLogs();

  return (
    <AppLayout title="Activity Logs" subtitle="Admin only — a live feed of every action across the vault.">
      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}
      {!isLoading && logs?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ScrollText className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-text-secondary">No activity recorded yet.</p>
        </div>
      )}
      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm">
                <span className="font-medium">{log.users?.full_name ?? "Unknown"}</span>{" "}
                <span className="text-text-secondary">{log.action.replace(/\./g, " ").replace(/_/g, " ")}</span>
              </p>
              {log.entity_type && <p className="text-xs text-text-muted">{log.entity_type} · {log.entity_id?.slice(0, 8)}</p>}
            </div>
            <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(log.created_at))} ago</span>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
