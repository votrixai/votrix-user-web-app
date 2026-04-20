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

/** One logical file (grouped by logical_id) with its in-session version chain,
 *  reconstructed from session events. `file_id` here means the Anthropic blob
 *  id — the per-version provider identifier we also use for download URLs. */
export interface SessionLogicalFile {
  logical_id: string;
  filename: string;
  versions: SessionLogicalFileVersion[];
}

export interface SessionLogicalFileVersion {
  file_id: string;
  version_index: number;
  source: "user_upload" | "agent_output";
  filename: string | null;
  mime_type: string | null;
  created_at: string | null;
}
