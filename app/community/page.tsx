"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const categories = [
  "전체보기", "공지사항", "자유게시판", "익명게시판", "고민상담", "포트폴리오", "Q&A", "자료실"
];

// 날짜 포맷 함수 (예: 04.15)
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}.${day}`;
};

export default function CommunityPage() {
  const [activeCat, setActiveCat] = useState("전체보기");
  const [sortType, setSortType] = useState("최신순");
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        // ⭐️ 에러 원인 해결: 없는 role_tag 컬럼 호출 제거하고 nickname만 가져옵니다!
        let query = supabase
          .from("posts")
          .select(`
            id,
            title,
            created_at,
            board_type,
            author_id,
            profiles:author_id (nickname)
          `);

        if (activeCat !== "전체보기") {
          query = query.eq("board_type", activeCat);
        }

        if (sortType === "최신순") {
          query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query.limit(20);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("게시글 불러오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeCat, sortType]);

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
        
        <Link 
          href={`/community/write?board=${activeCat === '전체보기' ? '자유게시판' : activeCat}`}
          className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-8 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-base shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">edit_square</span> 글쓰기
        </Link>
      </header>

      {/* 2. 상단 카테고리 탭 */}
      <nav className="flex overflow-x-auto scrollbar-hide border-b-4 border-[#222222] dark:border-[#444444]">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`whitespace-nowrap px-6 py-4 text-sm font-black transition-all border-b-4 -mb-[4px] flex items-center gap-2 ${
              activeCat === cat 
                ? 'border-[#222222] dark:border-[#EAEAEA] text-[#222222] dark:text-[#EAEAEA]' 
                : 'border-transparent text-[#A0A0A0] dark:text-[#666666] hover:text-[#222222] dark:hover:text-[#EAEAEA]'
            }`}
          >
            {cat}
            {activeCat === cat && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
          </button>
        ))}
      </nav>

      {/* 3. 리스트 상단 컨트롤 (정렬 필터) */}
      <div className="flex justify-between items-end pt-4">
        <span className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">
          <span className="text-blue-600 dark:text-blue-400">{activeCat}</span> 게시물 ({posts.length})
        </span>
        
        <div className="flex border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111]">
          {["최신순", "조회순", "추천순"].map((sort) => (
            <button 
              key={sort}
              onClick={() => setSortType(sort)}
              className={`px-3 py-1.5 text-xs font-bold border-r border-[#E5E4E0] dark:border-[#333333] last:border-0 transition-colors ${
                sortType === sort ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'
              }`}
            >
              {sort}
            </button>
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-[#A0A0A0] font-bold text-sm">
            <span className="animate-spin material-symbols-outlined mr-2">sync</span> 글 불러오는 중...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-[#A0A0A0] font-bold text-sm">
            아직 등록된 게시글이 없습니다.
          </div>
        ) : activeCat === "포트폴리오" ? (
          // ⭐️ 포트폴리오 게시판 뷰 (썸네일)
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="group cursor-pointer block">
                <div className="w-full aspect-[4/3] border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] mb-3 relative overflow-hidden group-hover:shadow-[4px_4px_0px_#222222] dark:group-hover:shadow-[4px_4px_0px_#111111] transition-all group-hover:-translate-y-1">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#222 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[#A0A0A0] opacity-50 group-hover:opacity-100 transition-opacity">image</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-[#222222] text-[#F5F4F0] text-[10px] font-bold px-1.5 py-0.5">
                    <span className="material-symbols-outlined text-[10px] mr-0.5">favorite</span>0
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-1 py-0.5 mr-2">포트폴리오</span>
                  <h3 className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] line-clamp-1 group-hover:underline underline-offset-2">{post.title}</h3>
                  <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666]">
                    {post.profiles?.nickname || "익명"} <span className="font-mono ml-2">조회 0</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // ⭐️ 일반 텍스트 게시판 뷰 (리스트)
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
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <Link key={post.id} href={`/community/${post.id}`} legacyBehavior>
                    <tr className="border-b border-[#E5E4E0] dark:border-[#333333] cursor-pointer hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors group text-center">
                      <td className="py-4">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 border border-[#E5E4E0] dark:border-[#444444] text-[#666666] dark:text-[#A0A0A0] bg-white dark:bg-[#121212]">
                          {post.board_type.replace("게시판", "").substring(0, 2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[300px] sm:max-w-[400px] lg:max-w-[500px]">
                          {post.title}
                        </h3>
                      </td>
                      <td className="py-4 text-xs font-bold text-[#666666] dark:text-[#A0A0A0] truncate px-2">
                        {post.board_type === "익명게시판" ? "ㅇㅇ(익명)" : (
                          <div className="flex items-center justify-center gap-1">
                            {post.profiles?.nickname || "알수없음"}
                            {/* ⭐️ role_tag DB 호출을 빼고 하드코딩된 UI로 안전하게 대체 */}
                            <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-1 text-[8px] rounded-sm font-black">
                              디자이너
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">{formatDate(post.created_at)}</td>
                      <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">0</td>
                      <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">0</td>
                    </tr>
                  </Link>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. 정통 페이징 */}
      <div className="flex justify-center items-center gap-1 pt-4">
        <button className="w-8 h-8 flex items-center justify-center border-2 border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors bg-white dark:bg-[#1E1E1E]">
          <span className="material-symbols-outlined text-[16px]">keyboard_double_arrow_left</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center border-2 border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors bg-white dark:bg-[#1E1E1E] mr-2">
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        
        {[1].map((p) => (
          <button 
            key={p} 
            className={`w-8 h-8 font-black text-xs border-2 transition-all flex items-center justify-center ${
              p === 1 
                ? 'border-[#222222] dark:border-[#EAEAEA] bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212]' 
                : 'border-transparent text-[#666666] dark:text-[#A0A0A0] hover:border-[#E5E4E0] dark:hover:border-[#333333]'
            }`}
          >
            {p}
          </button>
        ))}

        <button className="w-8 h-8 flex items-center justify-center border-2 border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors bg-white dark:bg-[#1E1E1E] ml-2">
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center border-2 border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors bg-white dark:bg-[#1E1E1E]">
          <span className="material-symbols-outlined text-[16px]">keyboard_double_arrow_right</span>
        </button>
      </div>

      {/* 6. 하단 검색 바 */}
      <div className="flex justify-center pt-8 pb-12">
        <div className="flex border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-1">
          <select className="bg-transparent text-sm font-bold text-[#666666] dark:text-[#A0A0A0] outline-none pl-3 pr-2 border-r-2 border-[#E5E4E0] dark:border-[#333333] cursor-pointer">
            <option>제목+내용</option>
            <option>제목만</option>
            <option>글쓴이</option>
          </select>
          <input 
            type="text" 
            placeholder={`${activeCat} 내에서 검색`} 
            className="w-48 md:w-64 bg-transparent px-4 text-sm font-bold text-[#222222] dark:text-[#EAEAEA] outline-none placeholder-[#A0A0A0] dark:placeholder-[#666666]"
          />
          <button className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] px-4 py-2 font-black text-sm hover:opacity-90 transition-opacity flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">search</span> 검색
          </button>
        </div>
      </div>

    </div>
  );
}