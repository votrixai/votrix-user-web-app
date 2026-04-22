"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
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
  const [filesOpen, setFilesOpen] = useState(false);

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
          <main className="flex h-full min-h-0 bg-background">
            <div className="relative flex min-w-0 flex-1 flex-col">
              {sessionFiles.length > 0 && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={() => setFilesOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
                    aria-expanded={filesOpen}
                    aria-controls="session-files-panel"
                  >
                    {filesOpen ? (
                      <PanelRightCloseIcon className="size-4" />
                    ) : (
                      <PanelRightOpenIcon className="size-4" />
                    )}
                    <span>View Files</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {sessionFiles.length}
                    </span>
                  </button>
                </div>
              )}
              <Thread />
            </div>

            {sessionFiles.length > 0 && filesOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 bg-black/40 md:hidden"
                  onClick={() => setFilesOpen(false)}
                  aria-hidden="true"
                />
                <aside
                  id="session-files-panel"
                  className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l bg-background shadow-xl md:static md:z-0 md:w-80 md:max-w-none md:shrink-0 md:shadow-none"
                >
                  <SessionFilesPanel files={sessionFiles} onClose={() => setFilesOpen(false)} />
                </aside>
              </>
            )}
          </main>
        </TooltipProvider>
      </AssistantRuntimeProvider>
    </AttachmentContext.Provider>
  );
}
