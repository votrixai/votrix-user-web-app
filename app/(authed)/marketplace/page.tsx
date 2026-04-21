import { backendFetch } from "@/lib/backend";
import type { AgentConfig } from "@/lib/models/agent";
import Marketplace from "@/components/marketplace";

export default async function MarketplacePage() {
  let agents: AgentConfig[] = [];
  try {
    const res = await backendFetch("/agents");
    if (res.ok) agents = (await res.json()) as AgentConfig[];
  } catch {}

  return <Marketplace agents={agents} />;
}
