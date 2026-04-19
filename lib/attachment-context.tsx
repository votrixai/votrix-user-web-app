"use client";

import { createContext, useContext } from "react";

export interface PendingAttachment {
  file_id: string;
  filename: string;
  content_type: "document" | "image";
}

interface AttachmentContextValue {
  attachments: PendingAttachment[];
  addAttachment: (att: PendingAttachment) => void;
  removeAttachment: (fileId: string) => void;
  clearAttachments: () => void;
  clearAttachmentsUI: () => void;
}

export const AttachmentContext = createContext<AttachmentContextValue | null>(null);

export function useAttachments(): AttachmentContextValue {
  const ctx = useContext(AttachmentContext);
  if (!ctx) throw new Error("useAttachments must be used within AttachmentContext.Provider");
  return ctx;
}
