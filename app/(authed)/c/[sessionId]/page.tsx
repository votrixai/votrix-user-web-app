import { backendFetch } from "@/lib/backend";
import Chat from "@/components/chat";
import type { UIMessage } from "ai";
import type { SessionDetailResponse, SessionEventResponse, SessionFileResponse } from "@/lib/models/session";
import { notFound } from "next/navigation";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const [detailRes, filesRes] = await Promise.all([
    backendFetch(`/sessions/${sessionId}`),
    backendFetch(`/sessions/${sessionId}/files`),
  ]);
  if (!detailRes.ok) notFound();
  const detail = (await detailRes.json()) as SessionDetailResponse;
  const files: SessionFileResponse[] = filesRes.ok ? await filesRes.json() : [];

  const initialMessages = buildInitialMessages(detail.id, detail.events);
  const awaitingResponse = isAwaitingAssistantResponse(detail.events);

  return (
    <Chat
      initialMessages={initialMessages}
      sessionId={sessionId}
      sessionFiles={files}
      awaitingResponse={awaitingResponse}
    />
  );
}

function buildInitialMessages(
  sessionId: string,
  events: SessionEventResponse[],
): UIMessage[] {
  const messages: UIMessage[] = [];
  const pendingAiFiles: Array<{ file_id: string; filename: string | null; mime_type: string | null }> = [];

  for (const e of events) {
    const key = `${sessionId}-${e.event_index}`;
    if (e.type === "user_message") {
      messages.push({
        id: key,
        role: "user",
        parts: [{ type: "text", text: e.body }],
      });
    } else if (e.type === "user_attachments") {
      const last = messages[messages.length - 1];
      if (last?.role !== "user") continue;
      let atts: Array<{ file_id: string; filename?: string | null; content_type?: string }> = [];
      try { atts = JSON.parse(e.body); } catch { continue; }
      for (const a of atts) {
        last.parts.push({
          type: "file",
          mediaType: a.content_type === "image" ? "image/*" : "application/octet-stream",
          filename: a.filename ?? "attachment",
          url: `anthropic-file://${a.file_id}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    } else if (e.type === "ai_file") {
      try { pendingAiFiles.push(JSON.parse(e.body)); } catch {}
    } else if (e.type === "ai_message") {
      const parts: UIMessage["parts"] = [{ type: "text", text: e.body }];
      for (const f of pendingAiFiles) {
        parts.push({
          type: "tool-call",
          toolCallId: `${key}-${f.file_id}`,
          toolName: "__file_output__",
          args: { file_id: f.file_id, filename: f.filename, mime_type: f.mime_type },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
      pendingAiFiles.length = 0;
      messages.push({ id: key, role: "assistant", parts });
    }
  }

  return messages;
}

function isAwaitingAssistantResponse(events: SessionEventResponse[]) {
  let awaitingResponse = false;

  for (const event of events) {
    if (event.type === "user_message") {
      awaitingResponse = true;
      continue;
    }

    if (event.type === "ai_message") {
      awaitingResponse = false;
    }
  }

  return awaitingResponse;
}
