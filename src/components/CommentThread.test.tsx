import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommentThread } from "./CommentThread";

// Mock the Supabase client so this stays a pure unit/component test with
// no network dependency.
vi.mock("@/lib/supabaseClient", () => {
  const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  const insertMock = vi.fn().mockReturnThis();
  return {
    supabase: {
      auth: { onAuthStateChange: vi.fn(), getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: insertMock,
        single: vi.fn().mockResolvedValue({ data: { id: "1" }, error: null }),
      })),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      __insertMock: insertMock,
    },
  };
});

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CommentThread", () => {
  beforeEach(() => vi.clearAllMocks());

  it("disables submission of empty/whitespace-only comments", async () => {
    const user = userEvent.setup();
    renderWithClient(<CommentThread fileId="file-1" />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    const sendButton = screen.getByRole("button", { name: /send comment/i });

    // Whitespace-only input should not trigger a network insert.
    await user.type(input, "   ");
    await user.click(sendButton);

    const { supabase } = await import("@/lib/supabaseClient");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((supabase as any).__insertMock).not.toHaveBeenCalled();
  });
});
