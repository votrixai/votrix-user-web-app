"use client";

import { useMemo } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { UIMessage } from "ai";

export default function Chat({
  initialMessages,
  sessionId,
}: {
  initialMessages: UIMessage[];
  sessionId: string;
}) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
        body: { session_id: sessionId },
      }),
    [sessionId],
  );

  const runtime = useChatRuntime({
    transport,
    messages: initialMessages,
    id: sessionId,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <TooltipProvider>
        <main className="h-full">
          <Thread />
        </main>
      </TooltipProvider>
    </AssistantRuntimeProvider>
  );
}
