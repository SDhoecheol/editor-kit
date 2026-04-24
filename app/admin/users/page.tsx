import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UsersAdminClient from "./UsersAdminClient";

export default async function AdminUsersPage() {
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
  if (!session) redirect("/login");

  // Admin 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/admin/posts");
  }

  // 모든 유저 조회
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div>회원 목록을 불러오는데 실패했습니다: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
          회원 관리
        </h1>
        <p className="text-[#A0A0A0] dark:text-[#666666] font-bold mt-2">
          총 {users?.length || 0}명의 회원이 가입되어 있습니다.
        </p>
      </div>

      <UsersAdminClient initialUsers={users || []} />
    </div>
  );
}
