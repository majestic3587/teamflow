export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "manager" | "member";
  created_at: string;
};

/** メンバー一覧表示用（auth.users と JOIN した結果） */
export type WorkspaceMemberWithUser = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMember["role"];
  created_at: string;
  display_name: string;
  email: string;
};

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
};

export type UpdateWorkspaceInput = {
  name?: string;
  description?: string;
};
