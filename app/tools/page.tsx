import Link from 'next/link';

// ⭐️ 각 툴마다 이동할 주소(link)를 추가했습니다!
const tools = [
  { id: 1, name: "세네카(책등) 계산기", desc: "종이 평량과 페이지 수로 정확한 책등 두께를 계산합니다.", icon: "menu_book", status: "안정", link: "/tools/seneca" },
  { id: 2, name: "QR/바코드 제네레이터", desc: "인쇄용 고해상도(CMYK/K100) QR 및 바코드 벡터를 생성합니다.", icon: "qr_code_scanner", status: "안정", link: "/tools/barcode" },
  { id: 3, name: "인쇄 견적 비교기", desc: "주요 인쇄소별 예상 견적과 소요 일정을 한눈에 비교합니다.", icon: "receipt_long", status: "베타", link: "/tools/estimate" },
  { id: 4, name: "해상도/CMYK 안전 체크", desc: "이미지 업로드 시 인쇄 사고 방지를 위한 사전 검사를 진행합니다.", icon: "plumbing", status: "개발중", link: "/tools/preflight" },
  { id: 5, name: "단축키 컨버터", desc: "포토샵, 일러스트, 인디자인 단축키를 서로 변환해 줍니다.", icon: "keyboard", status: "개발중", link: "/tools/shortcuts" },
  { id: 6, name: "포트폴리오 3D 목업", desc: "평면 이미지를 넣으면 고화질 입체 목업 이미지로 렌더링합니다.", icon: "view_in_ar", status: "PRO", link: "/tools/mockup" },
];

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="border-b-2 border-[#222222] dark:border-[#F5F4F0] pb-6 mb-10">
        <h1 className="text-3xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tight">유틸리티 툴</h1>
        <p className="text-[#666666] dark:text-[#A0A0A0] text-sm mt-2">인쇄/디자인 실무의 효율을 극대화하는 에디터킷 전용 도구들입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          /* ⭐️ div 대신 Link를 사용하여 클릭 시 이동하도록 변경했습니다 */
          <Link href={tool.link} key={tool.id} className="group bg-white dark:bg-[#1A1A1A] border border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#F5F4F0] p-6 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full block">
            
            <div className="absolute top-6 right-6">
              <span className={`text-[10px] font-black tracking-widest px-2 py-1 border ${
                tool.status === '안정' ? 'border-[#E5E4E0] text-[#666666] dark:border-[#333333] dark:text-[#A0A0A0]' :
                tool.status === '베타' ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' :
                tool.status === 'PRO' ? 'bg-[#222222] text-[#F5F4F0] border-[#222222] dark:bg-[#F5F4F0] dark:text-[#222222] dark:border-[#F5F4F0]' :
                'border-dashed border-[#A0A0A0] text-[#A0A0A0]'
              }`}>
                {tool.status}
              </span>
            </div>

            <span className="material-symbols-outlined text-3xl text-[#222222] dark:text-[#F5F4F0] mb-6">
              {tool.icon}
            </span>
            
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#F5F4F0] mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tool.name}
            </h2>
            
            <p className="text-sm text-[#666666] dark:text-[#A0A0A0] leading-relaxed mb-6">
              {tool.desc}
            </p>

            <div className="mt-auto flex items-center gap-1 text-xs font-bold text-[#222222] dark:text-[#F5F4F0] opacity-0 group-hover:opacity-100 transition-opacity">
              실행하기 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}