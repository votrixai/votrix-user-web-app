"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";

const transport = new AssistantChatTransport({
  api: "/api/chat",
});

export default function Chat({
  initialMessages,
  sessionId,
}: {
  initialMessages: UIMessage[];
  sessionId: string;
}) {
  const runtime = useChatRuntime({
    transport,
    messages: initialMessages,
    id: sessionId,
  });

  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <TooltipProvider>
        <main className="relative h-full">
          <button
            onClick={handleSignOut}
            className="absolute right-4 top-4 z-10 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
          <Thread />
        </main>
      </TooltipProvider>
    </AssistantRuntimeProvider>
  );
}
