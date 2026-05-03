"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function checkStrictAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden: Strictly Requires Admin role");

  return { supabase };
}

export async function upsertNotice(data: any) {
  try {
    const { supabase } = await checkStrictAdmin();
    
    const { error } = await supabase.from("system_notices").upsert([data]);
    if (error) throw error;
    
    revalidatePath("/admin/notices");
    return { success: true };
  } catch (err: any) {
    console.error("Notice Upsert Error:", err);
    return { success: false, message: err.message };
  }
}

export async function deleteNotice(id: string) {
  try {
    const { supabase } = await checkStrictAdmin();
    
    const { error } = await supabase.from("system_notices").delete().eq("id", id);
    if (error) throw error;
    
    revalidatePath("/admin/notices");
    return { success: true };
  } catch (err: any) {
    console.error("Notice Delete Error:", err);
    return { success: false, message: err.message };
  }
}
