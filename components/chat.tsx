"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  awaitingResponse = false,
}: {
  initialMessages: UIMessage[];
  sessionId: string;
  sessionFiles?: SessionFileResponse[];
  awaitingResponse?: boolean;
}) {
  const router = useRouter();

  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [requestAttachments, setRequestAttachments] = useState<PendingAttachment[]>([]);

  const addAttachment = useCallback((att: PendingAttachment) => {
    const next = [...requestAttachments, att];
    setAttachments(next);
    setRequestAttachments(next);
  }, [requestAttachments]);

  const removeAttachment = useCallback((fileId: string) => {
    const next = requestAttachments.filter((a) => a.file_id !== fileId);
    setAttachments(next);
    setRequestAttachments(next);
  }, [requestAttachments]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setRequestAttachments([]);
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
            attachments: requestAttachments.map(({ file_id, content_type, filename }) => ({
              file_id,
              content_type,
              filename,
            })),
          },
        }),
      }),
    [requestAttachments, sessionId],
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

  useEffect(() => {
    if (!awaitingResponse) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [awaitingResponse, router]);

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
