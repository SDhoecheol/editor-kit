"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// 유틸리티: 관리자/매니저 권한 체크
async function checkAdminOrManager() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "user";
  if (role !== "admin" && role !== "manager") {
    throw new Error("Forbidden: Requires Admin or Manager role");
  }

  return { supabase, role };
}

// 유틸리티: 오직 관리자만 체크
async function checkStrictAdmin() {
  const { supabase, role } = await checkAdminOrManager();
  if (role !== "admin") {
    throw new Error("Forbidden: Strictly Requires Admin role");
  }
  return { supabase, role };
}

// 액션: 게시물 강제 삭제 (admin, manager 둘 다 가능)
export async function deleteAnyPost(postIds: string[]) {
  try {
    const { supabase } = await checkAdminOrManager();

    // supabase client created without service role key cannot bypass RLS for delete if RLS is enabled and strictly scoped to author.
    // wait, we don't have SUPABASE_SERVICE_ROLE_KEY here! 
    // BUT if the RLS policies in Supabase allow 'admin'/'manager' to delete, it works.
    // Since we don't know the RLS policy for posts, we must use service_role key to bypass RLS, OR assume the user will set up RLS.
    // However, since we don't have SUPABASE_SERVICE_ROLE_KEY in .env.local, we'll try to delete with the anon key and user's JWT. 
    // If it fails due to RLS, they need to update their RLS. We will output a clear error.
    
    // Supabase JS SDK allows delete using 'in' operator
    const { error } = await supabase
      .from("posts")
      .delete()
      .in("id", postIds);

    if (error) throw error;

    revalidatePath("/admin/posts");
    revalidatePath("/community");
    
    return { success: true };
  } catch (error: any) {
    console.error("deleteAnyPost error:", error.message);
    return { success: false, error: error.message };
  }
}

// 액션: 유저 권한 변경 (오직 admin만 가능)
export async function changeUserRole(userId: string, newRole: string) {
  try {
    const { supabase } = await checkStrictAdmin();

    const validRoles = ["admin", "manager", "user"];
    if (!validRoles.includes(newRole)) throw new Error("Invalid role");

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    
    return { success: true };
  } catch (error: any) {
    console.error("changeUserRole error:", error.message);
    return { success: false, error: error.message };
  }
}
