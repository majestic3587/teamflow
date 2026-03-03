export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileInput = {
  display_name?: string;
};
