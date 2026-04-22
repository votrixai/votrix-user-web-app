"use client";

import { DownloadIcon, XIcon } from "lucide-react";
import type { SessionFileResponse } from "@/lib/models/session";

export function SessionFilesPanel({
  files,
  onClose,
}: {
  files: SessionFileResponse[];
  onClose: () => void;
}) {
  return (
    <section className="flex h-full flex-col bg-muted/20">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Session Files</h2>
          <p className="text-xs text-muted-foreground">{files.length} available</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close files panel"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <a
              key={f.file_id}
              href={`/api/files/${f.file_id}/content`}
              download={f.filename ?? "download"}
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <DownloadIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{f.filename ?? f.file_id}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
