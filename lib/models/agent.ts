export interface IntegrationConfig {
  slug: string;
  tools: string[];
}

export interface AgentConfig {
  slug: string;
  name: string;
  model: string;
  skills: string[];
  integrations: IntegrationConfig[];
}
