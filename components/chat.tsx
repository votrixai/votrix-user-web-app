"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
        body: { session_id: sessionId },
      }),
    [sessionId],
  );

  const sidebarRefreshed = useRef(false);
  const onFinish = useCallback(() => {
    if (sidebarRefreshed.current) return;
    sidebarRefreshed.current = true;
    router.refresh();
  }, [router]);

  const runtime = useChatRuntime({
    transport,
    messages: initialMessages,
    id: sessionId,
    onFinish,
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
