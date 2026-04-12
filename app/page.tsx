"use client";

import Link from "next/link";

// ⭐️ 타입 정의 유지
type PostType = {
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

export default function Home() {
  // 기획 3.5: 핵심 4개 게시판 데이터
  const communityPreviews: BoardType[] = [
    { 
      id: "공지사항", 
      title: "공지사항", 
      icon: "campaign",
      posts: [
        { title: "커뮤니티 이용 규칙 및 잉크(Ink) 보상 안내", date: "04.15" },
        { title: "에디터킷 V2.2 업데이트: 3D 목업 툴 개선", date: "04.10" },
        { title: "서버 점검에 따른 이용 제한 안내 (04.15)", date: "04.05" },
        { title: "신규 유틸리티 툴 추가 설문조사", date: "03.28" },
        { title: "에디터킷 베타 테스터 우수 회원 발표", date: "03.15" }
      ]
    },
    { 
      id: "자유게시판", 
      title: "자유게시판", 
      icon: "forum",
      posts: [
        { title: "오늘 인쇄소에서 진짜 레전드 빌런 만남", comments: 12 },
        { title: "다들 종이 발주 어디서 하시나요? 추천 좀요", comments: 5 },
        { title: "인디자인 단축키 외우기 좋은 바탕화면 공유", comments: 24 },
        { title: "야근하면서 먹기 좋은 간식 추천 받습니다", comments: 8 },
        { title: "요즘 클라이언트들 왜 이렇게 수정이 많을까요...", comments: 3 }
      ]
    },
    { 
      id: "Q&A", 
      title: "Q&A", 
      icon: "quiz",
      posts: [
        { title: "[인쇄] 은별색 오버프린트 설정 어떻게 하나요?", comments: 2, resolved: true },
        { title: "[디자인] 일러스트에서 CMYK 변환 시 탁해지는 문제", comments: 0, resolved: false },
        { title: "[인쇄] 스노우지 250g 코팅하면 세네카 덜 터지나요?", comments: 5, resolved: true },
        { title: "[디자인] PDF 내보내기 할 때 폰트 아웃라인 오류", comments: 1, resolved: false },
        { title: "[인쇄] 국전지로 16P 접지 하리꼬미 하려는데 여백 질문", comments: 3, resolved: false },
        // ⭐️ 레이아웃 밸런스를 위해 Q&A에만 더 많은 더미 데이터 추가
        { title: "[디자인] 모니터 캘리브레이션 장비 추천해주세요", comments: 7, resolved: true },
        { title: "[인쇄] 중철 제본 시 페이지 안쪽 여백 얼마나 주시나요?", comments: 4, resolved: false },
        { title: "[기타] 프리랜서 단가 책정 기준이 궁금합니다", comments: 15, resolved: true }
      ]
    },
    { 
      id: "포트폴리오", 
      title: "포트폴리오", 
      icon: "photo_library",
      posts: [
        { title: "[패키지] 커피 원두 파우치 디자인 리뉴얼" },
        { title: "[편집] 2026 서울 디자인 페스티벌 도록" },
        { title: "[브랜딩] 성수동 신규 카페 BI 및 어플리케이션" },
        { title: "[편집] 독립출판 에세이집 내지 및 표지 디자인" },
        { title: "[패키지] 유기농 화장품 브랜드 단상자 디자인" }
      ]
    }
  ];

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8 transition-colors duration-300">
      
      {/* ==========================================
          [Left/Center] 메인 대시보드 영역 (col-span-3)
          ========================================== */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* 1. 히어로 배너 (Hero Banner) */}
        <div className="bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-8 relative overflow-hidden transition-colors">
          <div className="relative z-10 w-2/3">
            <span className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] font-black text-[10px] uppercase tracking-widest px-2 py-0.5 mb-4">
              Notice
            </span>
            <h2 className="text-3xl font-black mb-3 leading-tight">
              에디터킷 V2.0 업데이트<br />
              3D 패키징 목업 기능 추가!
            </h2>
            <p className="text-sm text-[#666666] dark:text-[#A0A0A0] mb-6">
              번거로운 포토샵 합성 없이, 단 3초 만에 PDF를 입체적인 책자로 변환하세요.
            </p>
            <Link 
              href="/tools/mockup3d" 
              className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-6 py-2 font-bold text-sm hover:bg-transparent hover:text-[#222222] dark:hover:bg-[#1E1E1E] dark:hover:text-[#EAEAEA] transition-all shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#444444] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              자세히 보기
            </Link>
          </div>
          <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] text-[#222222]/5 dark:text-[#EAEAEA]/5 rotate-[-15deg] pointer-events-none">
            view_in_ar
          </span>
        </div>

        {/* 2. 커뮤니티 2x2 그리드 미리보기 */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 transition-colors">
            <h3 className="text-xl font-black dark:text-[#EAEAEA] flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span> 실시간 라운지
            </h3>
            <Link 
              href="/community" 
              className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors"
            >
              전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          {/* ⭐️ 그리드 아이템들이 높이를 꽉 채우도록 items-stretch 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* 일반 텍스트 게시판 (공지, 자유, Q&A) */}
            {communityPreviews.filter(b => b.id !== "포트폴리오").map((board) => (
              <div key={board.id} className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">{board.title}</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">{board.icon}</span>
                </div>
                
                {/* ⭐️ flex-1을 주어 남는 공간을 빈 여백으로 차지하게 하여 카드 높이를 강제로 맞춤 */}
                <ul className="flex-1 flex flex-col divide-y border-[#E5E4E0] dark:divide-[#333333]">
                  {/* ⭐️ Q&A는 8개, 나머지는 5개만 렌더링 (포트폴리오 높이에 맞춤) */}
                  {board.posts.slice(0, board.id === "Q&A" ? 8 : 5).map((post, idx) => (
                    <Link key={idx} href={`/community/1042`} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors flex justify-between items-center group flex-1">
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
                  ))}
                </ul>
              </div>
            ))}

            {/* 포트폴리오 게시판 (썸네일 갤러리 UI) */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors flex flex-col h-full">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] px-4 py-2.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">포트폴리오</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">photo_library</span>
              </div>
              <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Link key={item} href={`/community/1042`} className="group w-full">
                    <div className="w-full aspect-square border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] relative overflow-hidden group-hover:-translate-y-1 transition-transform">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#222 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-[#A0A0A0] opacity-50 group-hover:opacity-100 transition-opacity">image</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ==========================================
          [Right] 우측 사이드바 영역 (col-span-1)
          ========================================== */}
      <aside className="hidden lg:flex flex-col gap-6">
        
        {/* 1. 내 프로필 및 잉크 현황 */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
            My Profile
          </h3>
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] flex items-center justify-center font-black text-xl">
                필
              </div>
              <div>
                <div className="font-black dark:text-[#EAEAEA]">필터링천재</div>
                <div className="text-xs font-bold text-[#A0A0A0] mt-1">#인쇄장인 #패키지</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-[#F5F4F0] dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] p-3 mb-4 transition-colors">
              <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">보유 잉크</span>
              <span className="font-mono font-black text-lg text-[#222222] dark:text-[#EAEAEA]">
                <span className="text-sm opacity-80">💧</span> 1,240
              </span>
            </div>

            <Link 
              href="/mypage" 
              className="block text-center w-full bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] py-2 font-bold text-sm hover:bg-[#222222] hover:text-white dark:hover:bg-[#333333] dark:hover:text-white transition-colors"
            >
              내 프로필 관리
            </Link>
          </div>
        </div>

        {/* 2. 유틸리티 퀵 링크 위젯 */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
            Quick Tools
          </h3>
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
            <ul className="space-y-4">
              <li>
                <Link href="/tools/seneca" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                  <span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">menu_book</span> 세네카 계산기
                </Link>
              </li>
              <li>
                <Link href="/tools/harikomi" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                  <span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">grid_on</span> 하리꼬미 조판
                </Link>
              </li>
              <li>
                <Link href="/tools/yieldcalc" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                  <span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">calculate</span> 용지 수율 계산기
                </Link>
              </li>
              <li>
                <Link href="/tools/qrcode" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                  <span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">qr_code_2</span> 고화질 QR 생성기
                </Link>
              </li>
              <li className="border-t border-[#E5E4E0] dark:border-[#333333] pt-4 mt-2">
                <Link href="/tools/mockup3d" className="flex items-center gap-2 text-sm font-black text-[#222222] dark:text-[#EAEAEA] hover:opacity-70 transition-colors group">
                  <span className="material-symbols-outlined text-[18px] text-[#222222] dark:text-[#EAEAEA] group-hover:translate-x-1 transition-transform">view_in_ar</span> 3D 패키징 목업 (PRO)
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </aside>

    </main>
  );
}