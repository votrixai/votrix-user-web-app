"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, Bot, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SessionResponse } from "@/lib/models/session";
import type { AgentConfig } from "@/lib/models/agent";

type Props = {
  email: string;
  sessions: SessionResponse[];
  agents: AgentConfig[];
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

export default function Sidebar({ email, sessions, agents }: Props) {
  const router = useRouter();
  const params = useParams<{ sessionId?: string }>();
  const activeId = params?.sessionId;
  const [filter, setFilter] = useState<string>("all");
  const [creating, startCreating] = useTransition();
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const filtered = filter === "all"
    ? sessions
    : sessions.filter((s) => s.agent_slug === filter);
  const groups = groupSessions(filtered);

  const handleNewChat = (agentSlug: string) => {
    setShowAgentPicker(false);
    startCreating(async () => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_slug: agentSlug }),
      });
      if (!res.ok) return;
      const data = await res.json();
      router.push(`/c/${data.id}`);
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-muted/30">
      {/* New chat button with agent picker */}
      <div className="relative p-3">
        <button
          onClick={() => setShowAgentPicker((v) => !v)}
          disabled={creating}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" />
            {creating ? "Creating…" : "New chat"}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        {showAgentPicker && (
          <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            {agents.map((a) => (
              <button
                key={a.slug}
                onClick={() => handleNewChat(a.slug)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Bot className="size-4 text-muted-foreground" />
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agent filter */}
      <div className="px-3 pb-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
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
                <li key={s.id}>
                  <Link
                    href={`/c/${s.id}`}
                    className={`block truncate rounded-md px-2 py-1.5 text-sm transition-colors ${
                      activeId === s.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                    title={s.display_name || "Untitled"}
                  >
                    {s.display_name || "Untitled"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

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
      </div>
    </aside>
  );
}
