import { createClient } from "@/lib/supabase/server";
import Chat from "@/components/chat";
import type { UIMessage } from "ai";
import type { SessionResponse, SessionDetailResponse } from "@/lib/models/session";

const BACKEND_URL = process.env.BACKEND_URL!;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from("users")
    .select("agent_id")
    .eq("id", user!.id)
    .single();

  if (!userRecord?.agent_id) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Your agent is being set up. Please check back soon.
        </p>
      </main>
    );
  }

  const { initialMessages, sessionId } = await loadHistory(user!.id);

  // Always have a valid UUID so the backend can track the session
  const effectiveSessionId = sessionId ?? crypto.randomUUID();

  return <Chat initialMessages={initialMessages} sessionId={effectiveSessionId} />;
}

async function loadHistory(
  userId: string,
): Promise<{ initialMessages: UIMessage[]; sessionId: string | null }> {
  try {
    const sessionsRes = await fetch(`${BACKEND_URL}/users/${userId}/sessions`);
    if (!sessionsRes.ok) return { initialMessages: [], sessionId: null };

    const sessions = (await sessionsRes.json()) as SessionResponse[];
    if (!sessions.length) return { initialMessages: [], sessionId: null };

    // Take the most recent session
    const latest = sessions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    const detailRes = await fetch(`${BACKEND_URL}/sessions/${latest.id}`);
    if (!detailRes.ok) return { initialMessages: [], sessionId: String(latest.id) };

    const detail = (await detailRes.json()) as SessionDetailResponse;

    const messages: UIMessage[] = detail.events
      .filter((e) => e.type === "user_message" || e.type === "ai_message")
      .map((e) => ({
        id: `${detail.id}-${e.event_index}`,
        role: e.type === "user_message" ? "user" : "assistant",
        parts: [{ type: "text", text: e.body }],
      }));

    return { initialMessages: messages, sessionId: String(latest.id) };
  } catch {
    return { initialMessages: [], sessionId: null };
  }
}
