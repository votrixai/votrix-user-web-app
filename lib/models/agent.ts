// Generated from app/models/agent.py

export interface AgentConfig {
  slug: string;
  name: string;
  model: string;
  skills: string[];
  integrations: string[];
}

export interface AgentCache {
  agent_id: string;
  env_id: string;
  version: number;
}

export interface AgentDetail {
  config: AgentConfig;
  provisioned: boolean;
  cache: AgentCache | null;
}
