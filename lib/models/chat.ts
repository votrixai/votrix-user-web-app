// Generated from app/models/chat.py

export interface FileAttachment {
  file_id: string;
  content_type: "document" | "image";
  filename?: string | null;
}

export interface ChatRequest {
  session_id?: string;
  message: string;
  attachments?: FileAttachment[];
}
