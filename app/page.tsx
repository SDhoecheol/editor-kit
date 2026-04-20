import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProfileWidget } from "./HomeClientComponents"; // ⭐️ 클라이언트 컴포넌트로 분리한 프로필 위젯 불러오기

export const dynamic = 'force-dynamic';
// 날짜 변환 함수 (예: 04.15)
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}.${day}`;
};

// ⭐️ "use client" 제거! 완벽한 서버 컴포넌트(SSR) 적용
export default async function Home() {
  
  // ⭐️ 1. 게시글 리스트 패치 (서버에서 최신 100개를 가져와서 카테고리별로 나눔)
  // 조회수(view_count)와 달린 댓글 개수(comments)까지 한 번의 쿼리로 가져옵니다.
  const { data: postsData } = await supabase
    .from("posts")
    .select(`
      id, 
      title, 
      created_at, 
      board_type,
      view_count,
      is_resolved,
      comments (id)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // 데이터 안전망 처리
  const posts: any[] = postsData || [];

  // 카테고리별로 데이터 분류 (각 5개씩)
  const notices = posts.filter(p => p.board_type === "공지사항").slice(0, 5);
  const freePosts = posts.filter(p => p.board_type === "자유게시판").slice(0, 5);
  const qaPosts = posts.filter(p => p.board_type === "Q&A").slice(0, 5);
  const portfolioPosts = posts.filter(p => p.board_type === "포트폴리오").slice(0, 5);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8 transition-colors duration-300">
      
      <div className="lg:col-span-3 space-y-8">
        
        {/* 히어로 배너 */}
        <div className="bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-8 relative overflow-hidden transition-colors">
          <div className="relative z-10 w-2/3">
            <span className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] font-black text-[10px] uppercase tracking-widest px-2 py-0.5 mb-4">Notice</span>
            <h2 className="text-3xl font-black mb-3 leading-tight">에디터킷 V2.0 업데이트<br />3D 패키징 목업 기능 추가!</h2>
            <p className="text-sm text-[#666666] dark:text-[#A0A0A0] mb-6">번거로운 포토샵 합성 없이, 단 3초 만에 PDF를 입체적인 책자로 변환하세요.</p>
            <Link href="/tools/mockup3d" className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-6 py-2 font-bold text-sm hover:bg-transparent hover:text-[#222222] dark:hover:bg-[#1E1E1E] dark:hover:text-[#EAEAEA] transition-all shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#444444] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">자세히 보기</Link>
          </div>
          <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] text-[#222222]/5 dark:text-[#EAEAEA]/5 rotate-[-15deg] pointer-events-none">view_in_ar</span>
        </div>

        {/* 커뮤니티 2x2 그리드 */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 transition-colors">
            <h3 className="text-xl font-black dark:text-[#EAEAEA] flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span> 실시간 라운지
            </h3>
            <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors">
              전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* 1. 공지사항 (날짜 표시) */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">공지사항</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">campaign</span>
              </div>
              
              <ul className="flex-1 flex flex-col divide-y border-[#E5E4E0] dark:divide-[#333333]">
                {notices.length > 0 ? (
                  notices.map((post) => (
                    <Link key={post.id} href={`/community/${post.id}`} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors flex justify-between items-center group flex-1">
                      <div className="flex items-center gap-2 overflow-hidden flex-1 pr-4">
                        <span className="w-1 h-1 rounded-full bg-[#A0A0A0] shrink-0"></span>
                        <span className="text-[13px] font-bold text-[#222222] dark:text-[#EAEAEA] truncate group-hover:underline underline-offset-2">
                          {post.title}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center py-6 text-[11px] font-bold text-[#A0A0A0]">등록된 공지사항이 없습니다.</div>
                )}
              </ul>
            </div>

            {/* 2. 자유게시판 (댓글 개수 표시) */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">자유게시판</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">forum</span>
              </div>
              
              <ul className="flex-1 flex flex-col divide-y border-[#E5E4E0] dark:divide-[#333333]">
                {freePosts.length > 0 ? (
                  freePosts.map((post) => (
                    <Link key={post.id} href={`/community/${post.id}`} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors flex justify-between items-center group flex-1">
                      <div className="flex items-center gap-2 overflow-hidden flex-1 pr-4">
                        <span className="w-1 h-1 rounded-full bg-[#A0A0A0] shrink-0"></span>
                        <span className="text-[13px] font-bold text-[#222222] dark:text-[#EAEAEA] truncate group-hover:underline underline-offset-2">
                          {post.title}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {/* ⭐️ DB에서 가져온 진짜 댓글 개수 매핑 */}
                        <span className="font-black text-[11px] text-blue-600 dark:text-blue-400">[{post.comments?.length || 0}]</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center py-6 text-[11px] font-bold text-[#A0A0A0]">등록된 글이 없습니다.</div>
                )}
              </ul>
            </div>

            {/* 3. Q&A (댓글 개수 표시) */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">Q&A</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">quiz</span>
              </div>
              
              <ul className="flex-1 flex flex-col divide-y border-[#E5E4E0] dark:divide-[#333333]">
                {qaPosts.length > 0 ? (
                  qaPosts.map((post) => (
                    <Link key={post.id} href={`/community/${post.id}`} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors flex justify-between items-center group flex-1">
                      <div className="flex items-center gap-2 overflow-hidden flex-1 pr-4">
                        <span className="w-1 h-1 rounded-full bg-[#A0A0A0] shrink-0"></span>
                        <span className="text-[13px] font-bold text-[#222222] dark:text-[#EAEAEA] truncate group-hover:underline underline-offset-2 flex items-center gap-1">
                          {post.is_resolved && <span className="text-[9px] bg-blue-600 text-white px-1 py-0.5 rounded-sm font-black tracking-widest shrink-0">해결</span>}
                          {post.title}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {/* ⭐️ DB에서 가져온 진짜 댓글 개수 매핑 */}
                        <span className="font-black text-[11px] text-blue-600 dark:text-blue-400">[{post.comments?.length || 0}]</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center py-6 text-[11px] font-bold text-[#A0A0A0]">등록된 질문이 없습니다.</div>
                )}
              </ul>
            </div>

            {/* 4. 포트폴리오 (조회수 표시) */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">포트폴리오</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">photo_library</span>
              </div>
              <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start">
                {portfolioPosts.length > 0 ? (
                  portfolioPosts.map((post) => (
                    <Link key={post.id} href={`/community/${post.id}`} className="group w-full">
                      <div className="w-full aspect-square border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] relative overflow-hidden group-hover:-translate-y-1 transition-transform">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#222 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center gap-1">
                          <span className="material-symbols-outlined text-2xl text-[#A0A0A0] opacity-50 group-hover:opacity-100 transition-opacity">image</span>
                          <span className="text-[9px] font-bold text-[#A0A0A0] group-hover:text-[#222222] dark:group-hover:text-[#EAEAEA] w-full truncate">{post.title}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-[11px] font-bold text-[#A0A0A0]">등록된 포트폴리오가 없습니다.</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 우측 사이드바 영역 */}
      <aside className="hidden lg:flex flex-col gap-6">
        
        {/* ⭐️ 사용자 로그인 상태를 확인하는 클라이언트 컴포넌트 마운트 */}
        <ProfileWidget />

        <div>
          <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
            Quick Tools
          </h3>
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
            <ul className="space-y-4">
              <li><Link href="/tools/seneca" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group"><span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">menu_book</span> 세네카 계산기</Link></li>
              <li><Link href="/tools/harikomi" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group"><span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">grid_on</span> 하리꼬미 조판</Link></li>
              <li><Link href="/tools/yieldcalc" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group"><span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">calculate</span> 용지 수율 계산기</Link></li>
              <li><Link href="/tools/qrcode" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group"><span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">qr_code_2</span> 고화질 QR 생성기</Link></li>
              <li className="border-t border-[#E5E4E0] dark:border-[#333333] pt-4 mt-2"><Link href="/tools/mockup3d" className="flex items-center gap-2 text-sm font-black text-[#222222] dark:text-[#EAEAEA] hover:opacity-70 transition-colors group"><span className="material-symbols-outlined text-[18px] text-[#222222] dark:text-[#EAEAEA] group-hover:translate-x-1 transition-transform">view_in_ar</span> 3D 패키징 목업 (PRO)</Link></li>
            </ul>
          </div>
        </div>

      </aside>

    </main>
  );
}