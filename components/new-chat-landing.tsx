"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import type { AgentConfig } from "@/lib/models/agent";

export default function NewChatLanding({ agents }: { agents: AgentConfig[] }) {
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
        setSelected(null);
        return;
      }
      const data = await res.json();
      router.push(`/c/${data.id}`);
      router.refresh();
    });
  };

  return (
    <main className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-2xl font-semibold">
          Start a new chat
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Choose an agent to begin.
        </p>
        {agents.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No agents available.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((a) => (
              <button
                key={a.slug}
                onClick={() => start(a.slug)}
                disabled={creating}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Bot className="mt-0.5 size-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{a.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {selected === a.slug && creating
                      ? "Creating…"
                      : a.model}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
