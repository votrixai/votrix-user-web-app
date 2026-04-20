export interface SessionResponse {
  id: string;
  user_id: string;
  provider_session_title: string | null;
  agent_slug: string | null;
  created_at: string;
}

export interface SessionCreateResponse {
  id: string;
  user_id: string;
  agent_slug: string | null;
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
  agent_slug: string | null;
  created_at: string;
  events: SessionEventResponse[];
}

export interface SessionCreateRequest {
  agent_slug: string;
}

export interface SessionFileResponse {
  file_id: string;
  filename: string | null;
  mime_type: string | null;
}
