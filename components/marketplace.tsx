"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import type { AgentConfig } from "@/lib/models/agent";

export default function Marketplace({ agents }: { agents: AgentConfig[] }) {
  const router = useRouter();
  const [creating, startCreating] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);

  const start = (slug: string) => {
    setSelected(slug);
    startCreating(async () => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_slug: slug }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("create session failed", res.status, msg);
        alert(`Couldn't create chat (${res.status}): ${msg || "unknown error"}`);
        setSelected(null);
        return;
      }
      const data = await res.json();
      router.push(`/c/${data.id}`);
      router.refresh();
    });
  };

  return (
    <main className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-semibold">Marketplace</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Browse available agents and start a conversation.
        </p>
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No agents available.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {agents.map((a) => (
              <button
                key={a.slug}
                onClick={() => start(a.slug)}
                disabled={creating}
                className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-5 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Bot className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selected === a.slug && creating ? "Creating…" : a.model}
                    </div>
                  </div>
                </div>
                {a.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
