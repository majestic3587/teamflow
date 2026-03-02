export type UserRole = "owner" | "manager" | "member";

export type Profile = {
  id: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileInput = {
  display_name?: string;
};
