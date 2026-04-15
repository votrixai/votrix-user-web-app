// Generated from app/models/user.py

export interface CreateUserRequest {
  display_name: string;
}

export interface UserResponse {
  id: string;
  display_name: string;
  agent_id: string | null;
  created_at: string;
}

export interface ProvisionResponse {
  agent_id: string;
  /** false = already existed, true = newly created */
  provisioned: boolean;
}
