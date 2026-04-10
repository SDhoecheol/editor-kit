import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8 transition-colors duration-300">
      
      {/* ==========================================
          [Left/Center] 메인 대시보드 영역 (col-span-3)
          ========================================== */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* 1. 히어로 배너 (Hero Banner) - 밝은 톤 유지, 다크모드 팔레트 적용 */}
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
          {/* 데코레이션 아이콘 */}
          <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] text-[#222222]/5 dark:text-[#EAEAEA]/5 rotate-[-15deg] pointer-events-none">
            view_in_ar
          </span>
        </div>

        {/* 2. 커뮤니티 2x2 그리드 미리보기 (그림자 제거로 가독성 확보) */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 transition-colors">
            <h3 className="text-xl font-black dark:text-[#EAEAEA] flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span> 실시간 커뮤니티
            </h3>
            <Link 
              href="/community" 
              className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors"
            >
              전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 위젯: 공지사항 */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">공지사항</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">campaign</span>
              </div>
              <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">에디터킷 커뮤니티 이용 규칙 안내</span>
                  <span className="font-mono text-xs text-[#A0A0A0]">04.09</span>
                </li>
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">잉크(Ink) 보상 시스템 정책 변경 안내</span>
                  <span className="font-mono text-xs text-[#A0A0A0]">04.01</span>
                </li>
              </ul>
            </div>

            {/* 위젯: 자유게시판 */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">자유게시판</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">coffee</span>
              </div>
              <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[70%]">오늘 출력소 빌런 썰 푼다 ㅋㅋㅋ</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-[#222222] dark:text-[#EAEAEA]">[12]</span> 
                    <span className="material-symbols-outlined text-[14px] text-[#222222] dark:text-[#EAEAEA]">new_releases</span>
                  </div>
                </li>
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">
                    <span className="text-[#A0A0A0] text-xs mr-1 font-normal">[정보]</span>인디자인 버그 해결법
                  </span>
                  <span className="font-black text-[#222222] dark:text-[#EAEAEA] text-xs">[3]</span>
                </li>
              </ul>
            </div>

            {/* 위젯: Q&A */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">Q&A</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">help</span>
              </div>
              <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[70%]">
                    <span className="text-[#666666] dark:text-[#A0A0A0] text-xs mr-1 font-bold">[해결]</span>스노우지 250g 세네카 질문요
                  </span>
                  <span className="font-black text-[#222222] dark:text-[#EAEAEA] text-xs">[2]</span>
                </li>
                <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                  <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">일러스트에서 CMYK 변환 시 색상 탁해짐</span>
                  <span className="font-bold text-[#A0A0A0] text-xs">0</span>
                </li>
              </ul>
            </div>

            {/* 위젯: 포트폴리오 */}
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors">
              <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                <span className="dark:text-[#EAEAEA]">포트폴리오</span> 
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">image</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer">
                  <span className="material-symbols-outlined text-[#A0A0A0]">image</span>
                </div>
                <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer relative">
                  <span className="material-symbols-outlined text-[#A0A0A0]">image</span>
                  <span className="absolute top-1 right-1 material-symbols-outlined text-[12px] text-[#222222] dark:text-[#EAEAEA]">favorite</span>
                </div>
                <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer">
                  <span className="material-symbols-outlined text-[#A0A0A0]">image</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ==========================================
          [Right] 우측 사이드바 영역 (col-span-1)
          ========================================== */}
      <aside className="hidden lg:flex flex-col gap-6">
        
        {/* 1. 내 프로필 및 잉크 현황 (그림자 유지) */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
            My Profile
          </h3>
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] flex items-center justify-center font-black text-xl">
                E
              </div>
              <div>
                <div className="font-black dark:text-[#EAEAEA]">마감에쫓기는 스포이드</div>
                <div className="text-xs font-bold text-[#A0A0A0] mt-1">#웹디자이너 #프리랜서</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-[#F5F4F0] dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] p-3 mb-4 transition-colors">
              <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">보유 잉크</span>
              <span className="font-mono font-black text-lg text-[#222222] dark:text-[#EAEAEA]">
                <span className="text-sm opacity-80">💧</span> 1,240
              </span>
            </div>

            <Link 
              href="/welcome" 
              className="block text-center w-full bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] py-2 font-bold text-sm hover:bg-[#222222] hover:text-white dark:hover:bg-[#333333] dark:hover:text-white transition-colors"
            >
              내 프로필 관리
            </Link>
          </div>
        </div>

        {/* 2. 유틸리티 퀵 링크 위젯 (그림자 유지) */}
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
                  <span className="material-symbols-outlined text-[18px] text-[#A0A0A0] group-hover:translate-x-1 transition-transform">view_module</span> 하리꼬미 조판
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