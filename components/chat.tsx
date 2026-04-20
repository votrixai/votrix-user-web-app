"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SessionFilesPanel } from "@/components/session-files-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AttachmentContext, type PendingAttachment } from "@/lib/attachment-context";
import type { SessionFileResponse } from "@/lib/models/session";
import type { UIMessage } from "ai";

export default function Chat({
  initialMessages,
  sessionId,
  sessionFiles = [],
}: {
  initialMessages: UIMessage[];
  sessionId: string;
  sessionFiles?: SessionFileResponse[];
}) {
  const router = useRouter();

  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const attachmentsRef = useRef<PendingAttachment[]>([]);

  const addAttachment = useCallback((att: PendingAttachment) => {
    const next = [...attachmentsRef.current, att];
    attachmentsRef.current = next;
    setAttachments(next);
  }, []);

  const removeAttachment = useCallback((fileId: string) => {
    const next = attachmentsRef.current.filter((a) => a.file_id !== fileId);
    attachmentsRef.current = next;
    setAttachments(next);
  }, []);

  const clearAttachments = useCallback(() => {
    attachmentsRef.current = [];
    setAttachments([]);
  }, []);

  // Clears only the UI state (chips disappear immediately on send).
  // The ref stays intact so prepareRequestBody can still read it.
  const clearAttachmentsUI = useCallback(() => {
    setAttachments([]);
  }, []);

  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
        body: { session_id: sessionId },
        // Inject current attachments into every request body
        prepareSendMessagesRequest: async (options) => ({
          body: {
            ...options.body,
            id: options.id,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
            metadata: options.requestMetadata,
            attachments: attachmentsRef.current.map(({ file_id, content_type, filename }) => ({
              file_id,
              content_type,
              filename,
            })),
          },
        }),
      }),
    [sessionId],
  );

  const sidebarRefreshed = useRef(false);
  const onFinish = useCallback(() => {
    clearAttachments();
    if (sidebarRefreshed.current) return;
    sidebarRefreshed.current = true;
    router.refresh();
  }, [router, clearAttachments]);

  const runtime = useChatRuntime({
    transport,
    messages: initialMessages,
    id: sessionId,
    onFinish,
  });

  const attachmentContextValue = useMemo(
    () => ({ attachments, addAttachment, removeAttachment, clearAttachments, clearAttachmentsUI }),
    [attachments, addAttachment, removeAttachment, clearAttachments, clearAttachmentsUI],
  );

  return (
    <AttachmentContext.Provider value={attachmentContextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        <TooltipProvider>
          <main className="h-full">
            {sessionFiles.length > 0 && <SessionFilesPanel files={sessionFiles} />}
            <Thread />
          </main>
        </TooltipProvider>
      </AssistantRuntimeProvider>
    </AttachmentContext.Provider>
  );
}
