import { backendFetch } from "@/lib/backend";
import type { AgentConfig } from "@/lib/models/agent";
import NewChatLanding from "@/components/new-chat-landing";

export default async function Home() {
  let agents: AgentConfig[] = [];
  try {
    const res = await backendFetch("/agents");
    if (res.ok) agents = (await res.json()) as AgentConfig[];
  } catch {}

  return <NewChatLanding agents={agents} />;
}
