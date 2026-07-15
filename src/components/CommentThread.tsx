import { useComments, useAddComment } from "@/hooks/useComments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Send, MessageSquare } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function CommentThread({ fileId, folderId }: { fileId?: string; folderId?: string }) {
  const { data: comments, isLoading } = useComments(fileId, folderId);
  const addComment = useAddComment();
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addComment.mutate({ fileId, folderId, content: text.trim() }, { onSuccess: () => setText("") });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <MessageSquare className="h-4 w-4 text-text-secondary" />
        <span className="text-sm font-semibold">Comments</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && <p className="text-xs text-text-secondary">Loading…</p>}
        {!isLoading && comments?.length === 0 && <p className="text-xs text-text-secondary">No comments yet — start the discussion.</p>}
        {comments?.map((c: any) => (
          <div key={c.id} className="rounded-lg bg-bg-secondary p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold">{c.users?.full_name ?? "Unknown"}</span>
              <span className="text-[11px] text-text-muted">{formatDistanceToNow(new Date(c.created_at))} ago</span>
            </div>
            <p className="text-sm">{c.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border-subtle p-3">
        <Input placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" size="icon" aria-label="Send comment" loading={addComment.isPending}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
