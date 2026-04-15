// Generated from app/models/session.py

// ---------------------------------------------------------------------------
// Internal session models (DB responses)
// ---------------------------------------------------------------------------

export interface SessionResponse {
  id: string;
  user_id: string;
  created_at: string;
}

export interface SessionCreateResponse {
  id: string;
  user_id: string;
  session_id: string;
  created_at: string;
}

export interface SessionEventResponse {
  event_index: number;
  type: string;
  title: string | null;
  body: string;
}

export interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  events: SessionEventResponse[];
}

// ---------------------------------------------------------------------------
// Anthropic Managed Agents — session schemas
// ---------------------------------------------------------------------------

export type SessionStatus = "rescheduling" | "running" | "idle" | "terminated";

export interface Session {
  id: string;
  status: SessionStatus;
  agent_id: string;
  environment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  agent: string;
  environment_id: string;
}

export interface SessionListResponse {
  data: Session[];
  next_page: string | null;
}
