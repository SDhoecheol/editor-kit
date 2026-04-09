import Link from 'next/link';

// ⭐️ 대표님이 업로드해주신 실제 소스코드 폴더 6개와 100% 일치하게 링크 복구 완료
const tools = [
  { id: 1, name: "세네카(책등) 계산기", desc: "종이 평량과 페이지 수로 정확한 책등 두께를 계산합니다.", icon: "menu_book", status: "안정", link: "/tools/seneca" },
  { id: 2, name: "하리꼬미(터잡기) 배열", desc: "인쇄판 규격에 맞춰 페이지 배열(하리꼬미)을 시뮬레이션합니다.", icon: "view_module", status: "안정", link: "/tools/harikomi" },
  { id: 3, name: "종이 절수 계산기", desc: "전지 사이즈 대비 최적의 절수와 수율(로스율)을 자동 계산합니다.", icon: "grid_on", status: "안정", link: "/tools/yieldcalc" },
  { id: 4, name: "고화질 QR 제작기", desc: "인쇄용(CMYK/K100) 고해상도 벡터 QR 및 바코드를 생성합니다.", icon: "qr_code_2", status: "안정", link: "/tools/qrcode" },
  { id: 5, name: "3D 패키징 목업", desc: "전개도 평면 이미지를 고화질 입체 3D 목업으로 렌더링합니다.", icon: "view_in_ar", status: "PRO", link: "/tools/mockup3d" },
  { id: 6, name: "플립북 목업", desc: "PDF 파일을 실제 책을 넘겨보는 형태의 플립북으로 변환합니다.", icon: "auto_stories", status: "PRO", link: "/tools/flipbook" },
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
          <Link href={tool.link} key={tool.id} className="group bg-white dark:bg-[#1A1A1A] border border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#F5F4F0] p-6 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full block">
            
            <div className="absolute top-6 right-6">
              <span className={`text-[10px] font-black tracking-widest px-2 py-1 border ${
                tool.status === '안정' ? 'border-[#E5E4E0] text-[#666666] dark:border-[#333333] dark:text-[#A0A0A0]' :
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