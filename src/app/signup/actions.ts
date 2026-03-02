"use server";

import { createClient } from "@/utils/supabase/server";

export type SignupState = {
  error?: string;
  success?: boolean;
};

export async function signupWithEmail(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const displayName = (formData.get("displayName") as string).trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!displayName || !email || !password) {
    return { error: "すべての項目を入力してください。" };
  }

  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください。" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスはすでに登録されています。" };
    }
    return { error: "登録に失敗しました。しばらく経ってから再度お試しください。" };
  }

  return { success: true };
}
