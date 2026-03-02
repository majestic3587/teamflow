"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      ログアウト
    </button>
  );
}
