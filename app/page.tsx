import Link from 'next/link';

export default function Home() {
  // 메인에 노출할 4개 게시판 샘플 데이터
  const previews = [
    { title: "공지사항", link: "/community?cat=공지사항", posts: ["에디터킷 정식 오픈 안내", "서버 점검 공지 (04/10)"] },
    { title: "자유게시판", link: "/community?cat=자유게시판", posts: ["오늘 종이 값이 또 올랐네요..", "신입 디자이너 질문 받습니다"] },
    { title: "포토폴리오", link: "/community?cat=포토폴리오", posts: ["F&B 브랜드 패키지 작업물", "전시회 도록 디자인 공유"] },
    { title: "Q&A", link: "/community?cat=Q&A", posts: ["인디자인 별색 분판 문제", "일러스트 투명도 병합 오류"] },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 히어로 섹션 */}
      <div className="mb-20">
        <h1 className="text-6xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tighter mb-4">EditorKit</h1>
        <p className="text-lg text-[#666666] dark:text-[#A0A0A0] font-medium">인쇄/디자인 실무자를 위한 정교한 커뮤니티</p>
      </div>

      {/* 메인 4대 게시판 미리보기 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {previews.map((board) => (
          <div key={board.title} className="border-t-2 border-[#222222] dark:border-[#F5F4F0] pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tight">{board.title}</h2>
              <Link href={board.link} className="text-xs font-bold text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#F5F4F0] flex items-center gap-1">
                더보기 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
            <ul className="space-y-4">
              {board.posts.map((post, i) => (
                <li key={i} className="flex justify-between items-center group cursor-pointer">
                  <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] group-hover:text-[#222222] dark:group-hover:text-[#F5F4F0] transition-colors truncate mr-4">
                    {post}
                  </span>
                  <span className="text-[10px] text-[#E5E4E0] dark:text-[#333333]">04.03</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 퀵 액션 섹션 */}
      <div className="flex flex-wrap gap-4 pt-12 border-t border-[#E5E4E0] dark:border-[#333333]">
        <Link href="/tools" className="px-8 py-4 bg-[#222222] dark:bg-[#F5F4F0] text-[#F5F4F0] dark:text-[#222222] font-black text-sm hover:opacity-90 transition-opacity">
          실무 유틸리티 실행
        </Link>
        <Link href="/customer" className="px-8 py-4 border border-[#222222] dark:border-[#F5F4F0] text-[#222222] dark:text-[#F5F4F0] font-black text-sm hover:bg-[#F5F4F0] dark:hover:bg-[#1A1A1A] transition-all">
          고객센터 (건의사항)
        </Link>
      </div>
    </main>
  );
}