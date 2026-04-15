import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";
import Sidebar from "@/components/sidebar";
import type { SessionResponse } from "@/lib/models/session";
import type { AgentConfig } from "@/lib/models/agent";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sessions, agents] = await Promise.all([
    fetchJson<SessionResponse[]>("/sessions", []),
    fetchJson<AgentConfig[]>("/agents", []),
  ]);

  return (
    <div className="flex h-dvh">
      <Sidebar email={user?.email ?? ""} sessions={sessions} agents={agents} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await backendFetch(path);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
