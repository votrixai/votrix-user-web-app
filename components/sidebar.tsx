"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Trash2, Store, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SessionResponse } from "@/lib/models/session";

type Props = {
  email: string;
  userId: string;
  sessions: SessionResponse[];
};

type Group = { label: string; sessions: SessionResponse[] };

function groupSessions(sessions: SessionResponse[]): Group[] {
  const now = Date.now();
  const day = 86400000;
  const buckets: Record<string, SessionResponse[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };
  for (const s of sessions) {
    const age = now - new Date(s.created_at).getTime();
    if (age < day) buckets.Today.push(s);
    else if (age < 2 * day) buckets.Yesterday.push(s);
    else if (age < 7 * day) buckets["Previous 7 days"].push(s);
    else buckets.Older.push(s);
  }
  return Object.entries(buckets)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, sessions: arr }));
}

export default function Sidebar({ email, userId, sessions }: Props) {
  const router = useRouter();
  const params = useParams<{ sessionId?: string }>();
  const pathname = usePathname();
  const activeId = params?.sessionId;
  const marketplaceActive = pathname === "/marketplace";
  const [filter, setFilter] = useState<string>("all");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirm(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm]);

  const filtered = filter === "all"
    ? sessions
    : sessions.filter((s) => s.agent_slug === filter);
  const groups = groupSessions(filtered);

  const labelFor = (s: SessionResponse) => {
    const shortId = s.id.slice(0, 8);
    if (s.provider_session_title) {
      return s.provider_session_title;
    }
    return s.agent_slug ? `${s.agent_slug} · ${shortId}` : shortId;
  };

  const openDeleteConfirm = (s: SessionResponse) => {
    setMenu(null);
    setConfirm({ id: s.id, title: labelFor(s) });
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    const id = confirm.id;
    setConfirm(null);
    if (activeId === id) router.push("/");
    setDeleting((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="space-y-0.5 p-3">
        <Link
          href="/marketplace"
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
            marketplaceActive
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }`}
        >
          <Store className="size-4" />
          Marketplace
        </Link>
      </div>

      {/* Session list */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {groups.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">No chats yet</p>
        )}
        {groups.map((g) => (
          <div key={g.label}>
            <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
              {g.label}
            </h3>
            <ul className="space-y-0.5">
              {g.sessions.map((s) => (
                <li
                  key={s.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu({ id: s.id, x: e.clientX, y: e.clientY });
                  }}
                >
                  <Link
                    href={`/c/${s.id}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      deleting.has(s.id)
                        ? "pointer-events-none opacity-50"
                        : activeId === s.id
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                    title={labelFor(s)}
                  >
                    {deleting.has(s.id) ? (
                      <Loader2 className="size-3 shrink-0 animate-spin" />
                    ) : null}
                    <span className="truncate">{labelFor(s)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {menu && (
        <div
          className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-background shadow-lg"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              const s = sessions.find((x) => x.id === menu.id);
              if (s) openDeleteConfirm(s);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
          >
            <Trash2 className="size-4" />
            Delete chat
          </button>
        </div>
      )}

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
            <h2 className="text-base font-semibold">Delete chat?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will delete <span className="font-medium text-foreground">{confirm.title}</span>.
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

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate" title={email}>
            {email}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded p-1 hover:bg-muted hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="mt-1 text-xs text-muted-foreground/60" title={userId}>
          {userId}
        </div>
      </div>
    </aside>
  );
}
