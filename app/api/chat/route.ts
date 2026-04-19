import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";

export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { messages, session_id: sessionId, trigger, attachments } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Invalid request", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  const userText = extractText(lastMessage);

  if (!userText) {
    return new Response("No message content", { status: 400 });
  }

  const isRegenerate = trigger === "regenerate-message";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let textPartId = generateId();
      let textStarted = false;
      let textEnded = false;
      // backend tool_call_id → frontend toolCallId (1:1, may differ in format)
      const toolCallIds = new Map<string, string>();

      const endText = () => {
        if (textStarted && !textEnded) {
          writer.write({ type: "text-end", id: textPartId });
          textEnded = true;
        }
      };

      const resetText = () => {
        endText();
        textPartId = generateId();
        textStarted = false;
        textEnded = false;
      };

      try {
        const backendRes = await backendFetch(
          `/chat`,
          {
            method: "POST",
            body: JSON.stringify({
              session_id: sessionId,
              message: isRegenerate
                ? "Please regenerate your last response."
                : userText,
              attachments: isRegenerate ? [] : (attachments ?? []),
            }),
            signal: request.signal,
          },
        );

        if (!backendRes.ok) {
          const errorText = await backendRes.text();
          writer.write({ type: "error", errorText });
          return;
        }

        const reader = backendRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || request.signal?.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case "token": {
                if (!textStarted) {
                  writer.write({ type: "text-start", id: textPartId });
                  textStarted = true;
                }
                writer.write({
                  type: "text-delta",
                  delta: data.content,
                  id: textPartId,
                });
                break;
              }

              case "tool_start": {
                resetText();
                const tcId = generateId();
                toolCallIds.set(data.tool_call_id, tcId);
                writer.write({
                  type: "tool-input-available",
                  toolCallId: tcId,
                  toolName: data.name,
                  input: data.input ?? {},
                  providerExecuted: true,
                });
                break;
              }

              case "tool_end": {
                const tcId = toolCallIds.get(data.tool_call_id);
                if (tcId) {
                  writer.write({
                    type: "tool-output-available",
                    toolCallId: tcId,
                    output:
                      typeof data.output === "string"
                        ? data.output
                        : JSON.stringify(data.output),
                    providerExecuted: true,
                  });
                  toolCallIds.delete(data.tool_call_id);
                }
                break;
              }

              case "file": {
                resetText();
                const fileToolId = generateId();
                writer.write({
                  type: "tool-input-available",
                  toolCallId: fileToolId,
                  toolName: "__file_output__",
                  input: {
                    file_id: data.file_id,
                    filename: data.filename,
                    mime_type: data.mime_type,
                  },
                  providerExecuted: true,
                });
                writer.write({
                  type: "tool-output-available",
                  toolCallId: fileToolId,
                  output: "ready",
                  providerExecuted: true,
                });
                break;
              }

              case "done": {
                endText();
                return;
              }

              case "error": {
                endText();
                writer.write({
                  type: "error",
                  errorText: data.message ?? "An unknown error occurred",
                });
                return;
              }
            }
          }
        }
      } finally {
        try {
          endText();
        } catch {
          // Writer may already be closed
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

// --- Helpers ---

function extractText(message: {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("\n");
  }
  if (typeof message.content === "string") {
    return message.content;
  }
  return "";
}
