import { backendFetch } from "@/lib/backend";
import Chat from "@/components/chat";
import SessionFilesSidebar from "@/components/session-files-sidebar";
import type { UIMessage } from "ai";
import type {
  SessionDetailResponse,
  SessionEventResponse,
  SessionLogicalFile,
  SessionLogicalFileVersion,
} from "@/lib/models/session";
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

  const initialMessages = buildInitialMessages(detail.id, detail.events);
  const logicalFiles = collectLogicalFiles(detail.events);

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-hidden">
        <Chat initialMessages={initialMessages} sessionId={sessionId} />
      </div>
      <SessionFilesSidebar files={logicalFiles} />
    </div>
  );
}

/** Group the session's file events into logical files with version chains.
 *
 *  Tolerant of two event shapes:
 *   - NEW: body includes `logical_id` + `version_index` (enriched at write time)
 *   - LEGACY: only `file_id` (blob) is present — we treat each blob as its own
 *     logical file with version_index=1 so the sidebar still renders something. */
function collectLogicalFiles(events: SessionEventResponse[]): SessionLogicalFile[] {
  const byLogical = new Map<string, SessionLogicalFile>();
  const seenBlobs = new Set<string>();

  const pushVersion = (
    logicalId: string,
    filename: string,
    version: SessionLogicalFileVersion,
  ) => {
    if (seenBlobs.has(version.file_id)) return;
    seenBlobs.add(version.file_id);
    let entry = byLogical.get(logicalId);
    if (!entry) {
      entry = { logical_id: logicalId, filename, versions: [] };
      byLogical.set(logicalId, entry);
    }
    entry.versions.push(version);
    // Prefer the newest non-empty filename as the logical file's display name.
    if (version.filename && version.filename !== entry.filename) {
      entry.filename = version.filename;
    }
  };

  for (const e of events) {
    if (e.type === "ai_file") {
      let body: {
        file_id?: string;
        filename?: string | null;
        mime_type?: string | null;
        logical_id?: string | null;
        version_index?: number | null;
      };
      try { body = JSON.parse(e.body); } catch { continue; }
      const blobId = body.file_id;
      if (!blobId) continue;
      const logicalId = body.logical_id ?? blobId;
      pushVersion(logicalId, body.filename ?? blobId, {
        file_id: blobId,
        version_index: body.version_index ?? 1,
        source: "agent_output",
        filename: body.filename ?? null,
        mime_type: body.mime_type ?? null,
        created_at: null,
      });
    } else if (e.type === "user_attachments") {
      let atts: Array<{
        file_id?: string;
        filename?: string | null;
        content_type?: string;
        logical_id?: string | null;
        version_index?: number | null;
      }>;
      try { atts = JSON.parse(e.body); } catch { continue; }
      if (!Array.isArray(atts)) continue;
      for (const a of atts) {
        const blobId = a.file_id;
        if (!blobId) continue;
        const logicalId = a.logical_id ?? blobId;
        pushVersion(logicalId, a.filename ?? blobId, {
          file_id: blobId,
          version_index: a.version_index ?? 1,
          source: "user_upload",
          filename: a.filename ?? null,
          mime_type: null,
          created_at: null,
        });
      }
    }
  }

  return [...byLogical.values()].map((f) => ({
    ...f,
    versions: [...f.versions].sort((a, b) => a.version_index - b.version_index),
  }));
}

function buildInitialMessages(
  sessionId: string,
  events: SessionEventResponse[],
): UIMessage[] {
  const messages: UIMessage[] = [];
  const pendingAiFiles: Array<{
    file_id: string;
    filename: string | null;
    mime_type: string | null;
    parent_file_id?: string | null;
  }> = [];

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
          args: {
            file_id: f.file_id,
            filename: f.filename,
            mime_type: f.mime_type,
            parent_file_id: f.parent_file_id ?? null,
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
      pendingAiFiles.length = 0;
      messages.push({ id: key, role: "assistant", parts });
    }
  }

  return messages;
}
