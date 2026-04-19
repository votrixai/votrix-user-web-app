// Generated from app/models/event.py + app/routers/chat.py SSE format

// ---------------------------------------------------------------------------
// Backend SSE events (received from POST /agents/{slug}/chat)
// ---------------------------------------------------------------------------

export interface TokenEvent {
  type: "token";
  content: string;
}

export interface ToolStartEvent {
  type: "tool_start";
  name: string;
  input: Record<string, unknown>;
}

export interface ToolEndEvent {
  type: "tool_end";
  output: string | Record<string, unknown>;
}

export interface DoneEvent {
  type: "done";
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface FileEvent {
  type: "file";
  file_id: string;
  filename: string | null;
  mime_type: string | null;
}

export type ChatSSEEvent =
  | TokenEvent
  | ToolStartEvent
  | ToolEndEvent
  | DoneEvent
  | ErrorEvent
  | FileEvent;

// ---------------------------------------------------------------------------
// Anthropic Managed Agents — raw event schemas (backend-only, for reference)
// ---------------------------------------------------------------------------

export interface TextBlock {
  type: "text";
  text: string;
}

export interface UserMessageEvent {
  type: "user.message";
  content: TextBlock[];
}

export interface UserInterruptEvent {
  type: "user.interrupt";
}

export interface SendEventsRequest {
  events: (UserMessageEvent | UserInterruptEvent)[];
}
