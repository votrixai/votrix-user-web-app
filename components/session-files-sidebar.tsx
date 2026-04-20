"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileIcon,
  History,
} from "lucide-react";
import type {
  SessionLogicalFile,
  SessionLogicalFileVersion,
} from "@/lib/models/session";

type Props = {
  files: SessionLogicalFile[];
};

export default function SessionFilesSidebar({ files }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (logicalId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(logicalId)) next.delete(logicalId);
      else next.add(logicalId);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-muted/30">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Files</h2>
        <p className="text-xs text-muted-foreground">In this chat</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {files.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No files in this chat yet
          </p>
        ) : (
          <ul className="space-y-1">
            {files.map((f) => (
              <FileRow
                key={f.logical_id}
                file={f}
                expanded={expanded.has(f.logical_id)}
                onToggle={() => toggleExpand(f.logical_id)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function FileRow({
  file,
  expanded,
  onToggle,
}: {
  file: SessionLogicalFile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const versions = file.versions;
  const current = versions[versions.length - 1];
  const hasHistory = versions.length > 1;
  const downloadable = current?.source === "agent_output";

  return (
    <li className="rounded-md border border-border bg-background/60">
      <div className="flex items-start gap-2 px-2 py-2">
        <FileIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-medium" title={file.filename}>
              {file.filename}
            </div>
            {hasHistory && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                v{current.version_index}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {downloadable && current && (
              <a
                href={`/api/files/${current.file_id}/content`}
                download={file.filename}
                className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted"
                title="Download current version"
              >
                <Download className="size-3" />
                Download
              </a>
            )}
            {hasHistory && (
              <button
                onClick={onToggle}
                className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Version history"
              >
                <History className="size-3" />
                {versions.length} versions
                {expanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && hasHistory && (
        <ul className="border-t border-border bg-muted/30 px-2 py-1.5">
          {[...versions].reverse().map((v) => (
            <VersionRow
              key={v.file_id}
              version={v}
              filename={file.filename}
              isCurrent={v.file_id === current?.file_id}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function VersionRow({
  version,
  filename,
  isCurrent,
}: {
  version: SessionLogicalFileVersion;
  filename: string;
  isCurrent: boolean;
}) {
  const downloadable = version.source === "agent_output";
  return (
    <li className="flex items-center gap-2 py-1 text-xs">
      <span className="inline-flex min-w-8 shrink-0 items-center justify-center rounded bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
        v{version.version_index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isCurrent && (
            <span className="shrink-0 rounded bg-foreground/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-foreground">
              Current
            </span>
          )}
          <span className="shrink-0 rounded bg-muted px-1 py-px text-[9px] text-muted-foreground">
            {version.source === "user_upload" ? "Upload" : "Agent"}
          </span>
        </div>
      </div>
      {downloadable && (
        <a
          href={`/api/files/${version.file_id}/content`}
          download={filename}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          title={`Download v${version.version_index}`}
        >
          <Download className="size-3" />
        </a>
      )}
    </li>
  );
}
