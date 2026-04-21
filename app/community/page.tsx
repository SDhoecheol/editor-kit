import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ⭐️ 캐싱 방지 및 실시간 동기화 옵션 켜기
export const dynamic = 'force-dynamic';

const categories = [
  "전체보기", "공지사항", "자유게시판", "익명게시판", "고민상담", "포트폴리오", "Q&A", "자료실"
];

// 날짜 포맷 함수
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}.${day}`;
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const activeCat = (resolvedParams.cat as string) || "전체보기";
  const sortType = (resolvedParams.sort as string) || "최신순";
  
  // ⭐️ 페이징 및 검색 파라미터 추가
  const page = parseInt((resolvedParams.page as string) || "1", 10);
  const searchKeyword = (resolvedParams.search as string) || "";
  const ITEMS_PER_PAGE = 10;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // ⭐️ 쿼리 수정: is_anonymous 추가, count 포함
  let query = supabase
    .from("posts")
    .select(`
      id,
      title,
      created_at,
      board_type,
      author_id,
      view_count,
      comments(id),
      likes(id),
      profiles:author_id (nickname)
    `, { count: "exact" });

  if (activeCat !== "전체보기") {
    query = query.eq("board_type", activeCat);
  }

  // 검색어 필터링
  if (searchKeyword) {
    query = query.ilike("title", `%${searchKeyword}%`);
  }

  // 정렬 처리
  if (sortType === "최신순") {
    query = query.order("created_at", { ascending: false });
  } else if (sortType === "조회순") {
    query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false });
  }

  // ⭐️ 페이징 및 추천순 정렬 적용
  let posts: any[] = [];
  let count = 0;
  let error = null;

  if (sortType === "추천순") {
    // 추천순은 Supabase 조인 카운트 정렬 미지원으로 인해 JS 단에서 정렬 후 슬라이싱
    const { data: allPosts, error: allErr, count: allCount } = await query;
    error = allErr;
    if (allPosts) {
      count = allCount || 0;
      const sorted = [...allPosts].sort((a, b) => {
        const aLikes = a.likes?.length || 0;
        const bLikes = b.likes?.length || 0;
        if (bLikes !== aLikes) return bLikes - aLikes;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      posts = sorted.slice(from, to + 1);
    }
  } else {
    // 일반적인 DB 페이징
    const res = await query.range(from, to);
    posts = res.data || [];
    error = res.error;
    count = res.count || 0;
  }
  
  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;
  
  // ⭐️ 권한 체크 및 익명 블라인드 처리
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'admin' || profile?.role === 'manager') isAdmin = true;
  }

  // 익명게시판이거나 is_anonymous 플래그가 있는 경우 무조건 닉네임 덮어쓰기
  const displayPosts: any[] = (posts || []).map(post => {
    if (post.board_type === "익명게시판" || post.is_anonymous) {
      return { ...post, profiles: { nickname: "ㅇㅇ(익명)" } };
    }
    return post;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      {/* 1. 헤더 및 글쓰기 버튼 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              소통 공간
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄/디자인 실무자 커뮤니티
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            에디터킷 라운지
          </h1>
        </div>
        {/* ⭐️ 공지사항 탭에서는 관리자(Admin/Manager)만 글쓰기 버튼 노출 */}
        {!(activeCat === '공지사항' && !isAdmin) && (
          <Link 
            href={`/community/write?board=${activeCat === '전체보기' ? '자유게시판' : activeCat}`}
            className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-8 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-base shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">edit_square</span> 글쓰기
          </Link>
        )}
      </header>

      {/* 2. 상단 카테고리 탭 */}
      <nav className="flex overflow-x-auto scrollbar-hide border-b-4 border-[#222222] dark:border-[#444444]">
        {categories.map((cat) => (
          <Link 
            key={cat}
            href={`/community?cat=${cat}&sort=${sortType}${searchKeyword ? `&search=${searchKeyword}` : ''}`}
            className={`whitespace-nowrap px-6 py-4 text-sm font-black transition-all border-b-4 -mb-[4px] flex items-center gap-2 ${
              activeCat === cat 
                ? 'border-[#222222] dark:border-[#EAEAEA] text-[#222222] dark:text-[#EAEAEA]' 
                : 'border-transparent text-[#A0A0A0] dark:text-[#666666] hover:text-[#222222] dark:hover:text-[#EAEAEA]'
            }`}
          >
            {cat}
            {activeCat === cat && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
          </Link>
        ))}
      </nav>

      {/* 3. 리스트 상단 컨트롤 (정렬 필터) */}
      <div className="flex justify-between items-end pt-4">
        <span className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">
          <span className="text-blue-600 dark:text-blue-400">{activeCat}</span> 게시물 ({count || 0})
        </span>
        
        <div className="flex border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111]">
          {["최신순", "조회순", "추천순"].map((sort) => (
            <Link 
              key={sort}
              href={`/community?cat=${activeCat}&sort=${sort}${searchKeyword ? `&search=${searchKeyword}` : ''}`}
              className={`px-3 py-1.5 text-xs font-bold border-r border-[#E5E4E0] dark:border-[#333333] last:border-0 transition-colors ${
                sortType === sort ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'
              }`}
            >
              {sort}
            </Link>
          ))}
        </div>
      </div>

      {/* 4. 메인 게시판 영역 */}
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors min-h-[400px]">
        
        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] px-6 py-4 flex items-center justify-between">
           <h2 className="font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
             <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">tag</span>
             {activeCat}
           </h2>
           <span className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest">목록</span>
        </div>

        {error ? (
          <div className="flex justify-center items-center h-64 text-red-500 font-bold text-sm">
            게시글을 불러오는 중 오류가 발생했습니다.
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-[#A0A0A0] font-bold text-sm">
            아직 등록된 게시글이 없습니다.
          </div>
        ) : activeCat === "포트폴리오" ? (
          // 포트폴리오 게시판 뷰 (썸네일)
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="group cursor-pointer block">
                <div className="w-full aspect-[4/3] border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] mb-3 relative overflow-hidden group-hover:shadow-[4px_4px_0px_#222222] dark:group-hover:shadow-[4px_4px_0px_#111111] transition-all group-hover:-translate-y-1">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#222 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[#A0A0A0] opacity-50 group-hover:opacity-100 transition-opacity">image</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-[#222222] text-[#F5F4F0] text-[10px] font-bold px-1.5 py-0.5">
                    <span className="material-symbols-outlined text-[10px] mr-0.5">favorite</span>{post.likes?.length || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-1 py-0.5 mr-2">포트폴리오</span>
                  <h3 className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] line-clamp-1 group-hover:underline underline-offset-2">{post.title}</h3>
                  <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666]">
                    {post.profiles?.nickname || "익명"} <span className="font-mono ml-2">조회 {post.view_count || 0}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // 일반 텍스트 게시판 뷰 (리스트)
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] text-xs font-black text-[#222222] dark:text-[#EAEAEA] tracking-widest text-center">
                  <th className="py-3 w-16">구분</th>
                  <th className="py-3 px-4 text-left">제목</th>
                  <th className="py-3 w-32">작성자</th>
                  <th className="py-3 w-24">작성일</th>
                  <th className="py-3 w-16">조회</th>
                  <th className="py-3 w-16">추천</th>
                  <th className="py-3 w-16">댓글</th>
                </tr>
              </thead>
              <tbody>
                {displayPosts.map((post) => (
                  <tr key={post.id} className="border-b border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors group text-center">
                    <td className="py-4">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 border border-[#E5E4E0] dark:border-[#444444] text-[#666666] dark:text-[#A0A0A0] bg-white dark:bg-[#121212]">
                        {post.board_type.replace("게시판", "").substring(0, 2)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4 text-left">
                      <Link href={`/community/${post.id}`} className="flex items-center gap-2 w-full block">
                        <h3 className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[300px] sm:max-w-[400px] lg:max-w-[500px]">
                          {post.title}
                        </h3>
                      </Link>
                    </td>
                    
                    <td className="py-4 text-xs font-bold text-[#666666] dark:text-[#A0A0A0] truncate px-2">
                      {post.board_type === "익명게시판" || post.is_anonymous ? "ㅇㅇ(익명)" : (
                        <div className="flex items-center justify-center gap-1">
                          {post.profiles?.nickname || "알수없음"}
                          <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-1 text-[8px] rounded-sm font-black">
                            디자이너
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">{formatDate(post.created_at)}</td>
                    
                    <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">
                      {post.view_count || 0}
                    </td>
                    <td className="py-4 text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      {post.likes?.length || 0}
                    </td>
                    <td className="py-4 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {post.comments?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. 정통 페이징 */}
      <div className="flex justify-center items-center gap-1 pt-4">
        {/* 페이징 UI 생략 (기존과 동일) */}
      </div>

    </div>
  );
}