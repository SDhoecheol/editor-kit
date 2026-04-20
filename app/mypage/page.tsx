import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import MyPageClient from "./MyPageClient";
import Link from "next/link";

export default async function MyPage() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-2xl font-black">로그인이 필요합니다.</h2>
        <Link href="/login" className="inline-block bg-[#222222] text-[#F5F4F0] px-6 py-3 font-bold">
          로그인하러 가기
        </Link>
      </div>
    );
  }

  // 1. 프로필 정보 (잉크, 닉네임, 태그 등)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. 내가 쓴 글 리스트
  const { data: myPosts } = await supabase
    .from("posts")
    .select("id, title, created_at, view_count, board_type")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // ⭐️ 완벽하게 서버에서 준비된 데이터를 클라이언트 컴포넌트로 전달 (깜빡임 X)
  return <MyPageClient initialUser={user} initialProfile={profile} initialPosts={myPosts || []} />;
}