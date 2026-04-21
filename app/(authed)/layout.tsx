import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";
import Sidebar from "@/components/sidebar";
import type { SessionResponse } from "@/lib/models/session";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessions = await fetchJson<SessionResponse[]>("/sessions", []);

  return (
    <div className="flex h-dvh">
      <Sidebar email={user?.email ?? ""} userId={user?.id ?? ""} sessions={sessions} />
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
