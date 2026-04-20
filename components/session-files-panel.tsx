"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import type { SessionFileResponse } from "@/lib/models/session";

export function SessionFilesPanel({ files }: { files: SessionFileResponse[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
        Files ({files.length})
      </button>

      {open && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {files.map((f) => (
            <a
              key={f.file_id}
              href={`/api/files/${f.file_id}/content`}
              download={f.filename ?? "download"}
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <DownloadIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="max-w-48 truncate">{f.filename ?? f.file_id}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
