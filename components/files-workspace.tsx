"use client";

import { useMemo, useState } from "react";
import { Download, Trash2, FileIcon, Search, RefreshCw } from "lucide-react";

export interface FileMeta {
  file_id: string;
  filename: string;
  created_at: string;
  downloadable: boolean;
  mime_type?: string | null;
  size_bytes?: number | null;
}

type Tab = "uploads" | "outputs";

export default function FilesWorkspace({
  initialFiles,
}: {
  initialFiles: FileMeta[];
}) {
  const [files, setFiles] = useState<FileMeta[]>(initialFiles);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("uploads");
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm] = useState<FileMeta | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const uploadCount = files.filter((f) => !f.downloadable).length;
  const outputCount = files.filter((f) => f.downloadable).length;

  const filtered = useMemo(() => {
    const byTab = files.filter((f) =>
      tab === "uploads" ? !f.downloadable : f.downloadable,
    );
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((f) => f.filename.toLowerCase().includes(q));
  }, [files, query, tab]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) setFiles((await res.json()) as FileMeta[]);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    const id = confirm.file_id;
    setConfirm(null);
    setDeleting(id);
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) setFiles((prev) => prev.filter((f) => f.file_id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Files</h1>
          <p className="text-sm text-muted-foreground">
            Files in your workspace — what you uploaded, and what agents produced.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        <TabButton active={tab === "uploads"} onClick={() => setTab("uploads")}>
          Uploads <span className="ml-1 text-xs opacity-70">({uploadCount})</span>
        </TabButton>
        <TabButton active={tab === "outputs"} onClick={() => setTab("outputs")}>
          Output files <span className="ml-1 text-xs opacity-70">({outputCount})</span>
        </TabButton>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-border">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage(tab, files.length, query)}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((f) => (
              <li
                key={f.file_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <FileIcon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.filename}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatDate(f.created_at)}
                    {f.size_bytes != null && ` · ${formatSize(f.size_bytes)}`}
                  </div>
                </div>
                {f.downloadable && (
                  <a
                    href={`/api/files/${f.file_id}/content`}
                    download={f.filename}
                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-background"
                    title="Download"
                  >
                    <Download className="size-3.5" />
                    Download
                  </a>
                )}
                <button
                  onClick={() => setConfirm(f)}
                  disabled={deleting === f.file_id}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-background disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold">Delete file?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{confirm.filename}</span>.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function emptyMessage(tab: Tab, totalFiles: number, query: string): string {
  if (query.trim()) return "No files match your search";
  if (totalFiles === 0) return "No files yet";
  return tab === "uploads"
    ? "No uploaded files"
    : "No output files yet — files produced by the agent will appear here";
}
