import Link from "next/link";

export default function ToolsPage() {
  // 6대 핵심 유틸리티 데이터 정의
  const tools = [
    {
      title: "세네카 계산기",
      desc: "지류 평량과 페이지 수를 기반으로 정확한 책등 두께를 산출합니다.",
      href: "/tools/seneca",
      icon: "menu_book",
      id: "01",
    },
    {
      title: "하리꼬미 조판",
      desc: "인쇄용 터잡기 작업을 자동화하여 출력용 PDF를 생성합니다.",
      href: "/tools/harikomi",
      icon: "view_module",
      id: "02",
    },
    {
      title: "수율 계산기",
      desc: "규격별 전지 수율과 안착 효율을 계산하여 비용을 절감합니다.",
      href: "/tools/yieldcalc",
      icon: "calculate",
      id: "03",
    },
    {
      title: "고화질 QR 생성",
      desc: "인쇄물에 바로 사용 가능한 벡터(SVG) 방식의 QR코드를 제작합니다.",
      href: "/tools/qrcode",
      icon: "qr_code_2",
      id: "04",
    },
    {
      title: "3D 패키징 목업",
      desc: "제작 전 패키지 결과물을 WebGL 기반 3D 환경에서 미리 확인합니다.",
      href: "/tools/mockup3d",
      icon: "view_in_ar",
      id: "05",
      isPro: true,
    },
    {
      title: "2.5D 플립북",
      desc: "PDF 파일을 실제 책처럼 넘겨볼 수 있는 미리보기 링크를 생성합니다.",
      href: "/tools/flipbook",
      icon: "auto_stories",
      id: "06",
      isPro: true,
    },
  ];

  return (
    // ⭐️ 배경색 다크모드 완벽 대응
    <div className="bg-[#F5F4F0] dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] min-h-[calc(100vh-64px)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-16">
        
        {/* Header */}
        <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-8 mb-12 flex justify-between items-end transition-colors">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">EditorKit Utilities</h1>
            <p className="text-[#666666] dark:text-[#A0A0A0] mt-2 font-mono text-sm">
              Essential Tools for Print Professionals
            </p>
          </div>
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors">
            v2.2
          </span>
        </header>

        {/* 6대 핵심 툴 - 카드 그리드 레이아웃 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link 
              key={tool.id} 
              href={tool.href}
              className="group border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] p-8 transition-all relative flex flex-col justify-between h-72 cursor-pointer"
            >
              {/* 상단: ID 및 PRO 뱃지 */}
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold tracking-widest text-[#A0A0A0] dark:text-[#666666]">
                  TOOL / {tool.id}
                </span>
                {tool.isPro && (
                  <span className="border-2 border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </div>

              {/* 중단: 아이콘 및 타이틀 */}
              <div className="mt-4">
                <span className="material-symbols-outlined text-4xl mb-4 block text-[#222222] dark:text-[#EAEAEA]">
                  {tool.icon}
                </span>
                <h2 className="text-2xl font-black tracking-tight mb-2 text-[#222222] dark:text-[#EAEAEA]">
                  {tool.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#666666] dark:text-[#A0A0A0]">
                  {tool.desc}
                </p>
              </div>

              {/* 하단: 화살표 아이콘 */}
              <div className="self-end mt-4">
                <span className="material-symbols-outlined text-2xl transition-transform group-hover:translate-x-1 text-[#222222] dark:text-[#EAEAEA]">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* 하단 안내 섹션 (Callout 스타일 활용) */}
        <section className="pt-10">
          <div className="border-2 border-[#222222] dark:border-[#444444] border-l-8 bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-6 flex gap-4 items-start transition-colors">
            <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">info</span>
            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#EAEAEA]">기능 제안 안내</h4>
              <p className="text-sm mt-1 text-[#666666] dark:text-[#A0A0A0]">
                실무에 필요한 새로운 도구가 있으신가요? 커뮤니티의 <strong className="text-[#222222] dark:text-[#EAEAEA]">#기능제안</strong> 태그를 사용하여 의견을 남겨주세요.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}