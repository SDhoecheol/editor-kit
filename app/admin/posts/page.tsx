import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PostsAdminClient from "./PostsAdminClient";
import { redirect } from "next/navigation";

export default async function AdminPostsPage() {
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

  // 최신순으로 모든 게시물 조회 (프로필 조인 포함)
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      board_type,
      created_at,
      profiles ( nickname, email )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return <div>게시물을 불러오는데 실패했습니다: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
          게시물 관리
        </h1>
        <p className="text-[#A0A0A0] dark:text-[#666666] font-bold mt-2">
          총 {posts?.length || 0}개의 게시물이 있습니다.
        </p>
      </div>

      <PostsAdminClient initialPosts={posts || []} />
    </div>
  );
}
