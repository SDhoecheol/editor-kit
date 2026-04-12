"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PostType = {
  id: string; // ⭐️ 실제 글 클릭 시 이동할 ID
  title: string;
  date?: string;
  comments?: number;
  resolved?: boolean;
};

type BoardType = {
  id: string;
  title: string;
  icon: string;
  posts: PostType[];
};

// 날짜 변환 함수 (예: 04.15)
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}.${day}`;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  // ⭐️ 커뮤니티 섹션 실시간 데이터를 담을 State
  const [communityPreviews, setCommunityPreviews] = useState<BoardType[]>([
    { id: "공지사항", title: "공지사항", icon: "campaign", posts: [] },
    { id: "자유게시판", title: "자유게시판", icon: "forum", posts: [] },
    { id: "Q&A", title: "Q&A", icon: "quiz", posts: [] },
    { id: "포트폴리오", title: "포트폴리오", icon: "photo_library", posts: [] }
  ]);

  useEffect(() => {
    let isMounted = true; 

    const fetchUserAndPosts = async () => {
      try {
        // 1. 유저 정보 패치 (대표님께서 추가하신 타임아웃 유지)
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const authPromise = supabase.auth.getSession();
        
        const { data: { session }, error: sessionError } = await Promise.race([authPromise, timeout]) as any;
        
        if (sessionError) throw sessionError;

        if (isMounted) setUser(session?.user || null);

        if (session?.user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (data) {
            if (isMounted) setProfile(data);
          } else {
            const { data: newData, error: upsertError } = await supabase
              .from("profiles")
              .upsert({ 
                id: session.user.id, 
                email: session.user.email, 
                nickname: session.user.email?.split('@')[0] || "User",
                role_tag: "디자이너",
                ink_balance: 0
              })
              .select()
              .single();
              
            if (!upsertError && newData && isMounted) {
              setProfile(newData);
            }
          }
        }

        // ⭐️ 2. 게시글 리스트 패치 (최신 100개를 가져와서 카테고리별로 나눔)
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, title, created_at, board_type")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!postsError && postsData && isMounted) {
          const grouped = {
            "공지사항": postsData.filter(p => p.board_type === "공지사항").slice(0, 5),
            "자유게시판": postsData.filter(p => p.board_type === "자유게시판").slice(0, 5),
            "Q&A": postsData.filter(p => p.board_type === "Q&A").slice(0, 8),
            "포트폴리오": postsData.filter(p => p.board_type === "포트폴리오").slice(0, 6),
          };

          setCommunityPreviews([
            { id: "공지사항", title: "공지사항", icon: "campaign", posts: grouped["공지사항"].map(p => ({ id: p.id, title: p.title, date: formatDate(p.created_at) })) },
            { id: "자유게시판", title: "자유게시판", icon: "forum", posts: grouped["자유게시판"].map(p => ({ id: p.id, title: p.title, comments: 0 })) },
            { id: "Q&A", title: "Q&A", icon: "quiz", posts: grouped["Q&A"].map(p => ({ id: p.id, title: p.title, comments: 0, resolved: false })) },
            { id: "포트폴리오", title: "포트폴리오", icon: "photo_library", posts: grouped["포트폴리오"].map(p => ({ id: p.id, title: p.title })) }
          ]);
        }
      } catch (error) {
        console.warn("유저/게시글 로딩 지연 발생. 로딩을 강제 해제합니다.", error);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    fetchUserAndPosts();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      setUser(session?.user || null);
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data && isMounted) setProfile(data);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

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
            
            {/* 일반 텍스트 게시판 */}
            {communityPreviews.filter(b => b.id !== "포트폴리오").map((board) => (
              <div key={board.id} className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">{board.title}</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">{board.icon}</span>
                </div>
                
                <ul className="flex-1 flex flex-col divide-y border-[#E5E4E0] dark:divide-[#333333]">
                  {board.posts.length > 0 ? (
                    board.posts.map((post) => (
                      // ⭐️ 게시글 ID를 통해 상세페이지 링크 연결
                      <Link key={post.id} href={`/community/${post.id}`} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors flex justify-between items-center group flex-1">
                        <div className="flex items-center gap-2 overflow-hidden flex-1 pr-4">
                          <span className="w-1 h-1 rounded-full bg-[#A0A0A0] shrink-0"></span>
                          <span className="text-[13px] font-bold text-[#222222] dark:text-[#EAEAEA] truncate group-hover:underline underline-offset-2">
                            {post.title}
                          </span>
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-2">
                          {board.id === "공지사항" && <span className="font-mono text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">{post.date}</span>}
                          {board.id === "자유게시판" && <span className="font-black text-[11px] text-blue-600 dark:text-blue-400">[{post.comments}]</span>}
                          {board.id === "Q&A" && post.resolved && <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-widest">해결됨</span>}
                          {board.id === "Q&A" && !post.resolved && <span className="font-black text-[11px] text-blue-600 dark:text-blue-400">[{post.comments}]</span>}
                        </div>
                      </Link>
                    ))
                  ) : (
                    // 글이 없을 때 표시
                    <div className="flex-1 flex items-center justify-center py-6 text-[11px] font-bold text-[#A0A0A0]">
                      작성된 글이 없습니다.
                    </div>
                  )}
                </ul>
              </div>
            ))}

            {/* 포트폴리오 게시판 */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">포트폴리오</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">photo_library</span>
              </div>
              <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start">
                {communityPreviews.find(b => b.id === "포트폴리오")?.posts.length ? (
                  communityPreviews.find(b => b.id === "포트폴리오")?.posts.map((post) => (
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

      {/* 우측 사이드바 영역 (그대로 유지) */}
      <aside className="hidden lg:flex flex-col gap-6">
        
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
            My Profile
          </h3>
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors min-h-[220px] flex flex-col justify-center">
            
            {isChecking ? (
              <div className="text-center text-[#A0A0A0] font-bold text-sm flex flex-col items-center justify-center py-6">
                <span className="animate-spin material-symbols-outlined mb-2">sync</span>
                정보 확인 중...
              </div>
            ) : profile ? (
              <>
                <div className="flex gap-4 items-center mb-4">
                  <div className="w-12 h-12 bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] flex items-center justify-center font-black text-xl">
                    {profile.nickname ? profile.nickname.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="font-black dark:text-[#EAEAEA] truncate max-w-[120px]">{profile.nickname}</div>
                    <div className="text-xs font-bold text-[#A0A0A0] mt-1">{profile.role_tag || "#디자이너"}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-[#F5F4F0] dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] p-3 mb-4 transition-colors">
                  <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">보유 잉크</span>
                  <span className="font-mono font-black text-lg text-[#222222] dark:text-[#EAEAEA]">
                    <span className="text-sm opacity-80">💧</span> {profile.ink_balance?.toLocaleString() || 0}
                  </span>
                </div>

                <Link 
                  href="/mypage" 
                  className="block text-center w-full bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] py-2 font-bold text-sm hover:bg-[#222222] hover:text-white dark:hover:bg-[#333333] dark:hover:text-white transition-colors shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  내 프로필 관리
                </Link>
              </>
            ) : user ? (
              <div className="text-center py-6">
                <p className="text-sm font-bold text-red-500 mb-2">프로필 정보를 불러오지 못했습니다.</p>
                <button onClick={() => window.location.reload()} className="text-xs underline text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA]">
                  새로고침
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mb-4">로그인이 필요합니다.</p>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 w-full bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] py-2.5 font-black text-sm shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  로그인하러 가기
                </Link>
              </div>
            )}
          </div>
        </div>

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