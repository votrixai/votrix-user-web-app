import { backendFetch } from "@/lib/backend";
import Chat from "@/components/chat";
import type { UIMessage } from "ai";
import type { SessionDetailResponse } from "@/lib/models/session";
import { notFound } from "next/navigation";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const res = await backendFetch(`/sessions/${sessionId}`);
  if (!res.ok) notFound();
  const detail = (await res.json()) as SessionDetailResponse;

  const initialMessages: UIMessage[] = detail.events
    .filter((e) => e.type === "user_message" || e.type === "ai_message")
    .map((e) => ({
      id: `${detail.id}-${e.event_index}`,
      role: e.type === "user_message" ? "user" : "assistant",
      parts: [{ type: "text", text: e.body }],
    }));

  return <Chat initialMessages={initialMessages} sessionId={sessionId} />;
}
