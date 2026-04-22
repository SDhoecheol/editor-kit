import Link from "next/link";

export default function ToolsPage() {
  // 카테고리별 유틸리티 분류 (isPro 삭제)
  const toolCategories = [
    {
      categoryName: "PDF 편집 및 변환",
      desc: "PDF 문서를 수정하거나 변환하는 필수 도구들입니다.",
      tools: [
        {
          title: "PDF 병합",
          desc: "여러 개의 PDF 파일을 원하는 순서대로 하나의 파일로 합칩니다.",
          href: "/tools/pdf-merge",
          icon: "merge",
          id: "PDF-01",
        },
        {
          title: "PDF 분할",
          desc: "PDF 문서를 개별 페이지로 분리하거나 특정 페이지만 추출합니다.",
          href: "/tools/pdf-split",
          icon: "call_split",
          id: "PDF-02",
        },
        {
          title: "PDF 페이지 편집",
          desc: "PDF의 불필요한 페이지를 삭제하고 개별 페이지를 회전시킵니다.",
          href: "/tools/pdf-edit",
          icon: "edit_document",
          id: "PDF-03",
        },
        {
          title: "스마트 PDF 압축",
          desc: "텍스트와 벡터는 보존하고 이미지만 압축하여 고화질 저용량 PDF를 만듭니다.",
          href: "/tools/pdf-compress-target",
          icon: "compress",
          id: "PDF-04",
        },
        {
          title: "PDF 워터마크",
          desc: "PDF 문서의 모든 페이지에 텍스트 워터마크를 일괄 삽입합니다.",
          href: "/tools/pdf-watermark",
          icon: "branding_watermark",
          id: "PDF-05",
        },
        {
          title: "PDF 고화질 이미지 변환",
          desc: "인쇄용 해상도(300DPI)를 지원하여 PDF를 고품질 이미지로 변환합니다.",
          href: "/tools/pdf-to-img",
          icon: "imagesmode",
          id: "PDF-06",
        },
        {
          title: "이미지 PDF 변환",
          desc: "인쇄할 실제 mm 사이즈를 지정하여 이미지를 규격에 맞는 PDF로 변환합니다.",
          href: "/tools/img-to-pdf",
          icon: "picture_as_pdf",
          id: "PDF-07",
        },
      ]
    },
    {
      categoryName: "인쇄 및 터잡기 (조판)",
      desc: "출력 및 제본 실무에 필요한 계산 및 자동 배치 도구들입니다.",
      tools: [
        {
          title: "실사출력 자동 조판",
          desc: "롤 미디어 폭에 맞춰 스티커와 인쇄물들을 자동으로 최적 배치합니다.",
          href: "/tools/rollnester",
          icon: "wallpaper",
          id: "PRN-01",
        },
        {
          title: "하리꼬미 조판",
          desc: "인쇄용 터잡기 작업을 자동화하여 출력용 PDF를 생성합니다.",
          href: "/tools/harikomi",
          icon: "view_module",
          id: "PRN-02",
        },
        {
          title: "세네카 계산기",
          desc: "지류 평량과 페이지 수를 기반으로 정확한 책등 두께를 산출합니다.",
          href: "/tools/seneca",
          icon: "menu_book",
          id: "PRN-03",
        },
        {
          title: "수율 계산기",
          desc: "규격별 전지 수율과 안착 효율을 계산하여 비용을 절감합니다.",
          href: "/tools/yieldcalc",
          icon: "calculate",
          id: "PRN-04",
        },
      ]
    },
    {
      categoryName: "부가 기능 및 미리보기",
      desc: "작업물을 검증하거나 유용한 부가 리소스를 생성합니다.",
      tools: [
        {
          title: "3D 패키징 목업",
          desc: "제작 전 패키지 결과물을 WebGL 기반 3D 환경에서 미리 확인합니다.",
          href: "/tools/mockup3d",
          icon: "view_in_ar",
          id: "EXT-01",
        },
        {
          title: "2.5D 플립북",
          desc: "PDF 파일을 실제 책처럼 넘겨볼 수 있는 미리보기 링크를 생성합니다.",
          href: "/tools/flipbook",
          icon: "auto_stories",
          id: "EXT-02",
        },
        {
          title: "고화질 QR 생성",
          desc: "인쇄물에 바로 사용 가능한 벡터(SVG) 방식의 QR코드를 제작합니다.",
          href: "/tools/qrcode",
          icon: "qr_code_2",
          id: "EXT-03",
        },
      ]
    }
  ];

  return (
    <div className="bg-[#F5F4F0] dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] min-h-[calc(100vh-64px)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-20">
        
        {/* Header */}
        <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 md:pb-8 mb-8 md:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 transition-colors">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">EditorKit Utilities</h1>
            <p className="text-[#666666] dark:text-[#A0A0A0] mt-2 font-mono text-sm">
              Essential Tools for Print Professionals
            </p>
          </div>
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors">
            v3.0
          </span>
        </header>

        {/* 카테고리별 렌더링 */}
        {toolCategories.map((category, catIdx) => (
          <div key={catIdx} className="mb-12 md:mb-20">
            {/* 카테고리 헤더 */}
            <div className="mb-6 md:mb-8 border-l-4 md:border-l-8 border-[#222222] dark:border-[#444444] pl-3 md:pl-4">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#222222] dark:text-[#EAEAEA]">
                {category.categoryName}
              </h2>
              <p className="text-xs md:text-sm font-bold text-[#666666] dark:text-[#A0A0A0] mt-1">
                {category.desc}
              </p>
            </div>
            
            {/* 툴 그리드 */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {category.tools.map((tool) => (
                <Link 
                  key={tool.id} 
                  href={tool.href}
                  className="group border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#222222] md:shadow-[6px_6px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] dark:md:shadow-[6px_6px_0px_#111111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] p-5 md:p-6 transition-all relative flex flex-col justify-between h-auto min-h-[10rem] md:h-48 cursor-pointer"
                >
                  {/* 상단: ID 뱃지 */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold tracking-widest text-[#A0A0A0] dark:text-[#666666]">
                      {tool.id}
                    </span>
                  </div>

                  {/* 중단: 타이틀 및 설명 */}
                  <div className="mt-2 flex-1 flex flex-col justify-center gap-1 md:gap-2">
                    <h2 className="text-lg md:text-2xl font-black tracking-tight text-[#222222] dark:text-[#EAEAEA]">
                      {tool.title}
                    </h2>
                    <p className="text-xs md:text-sm leading-relaxed text-[#666666] dark:text-[#A0A0A0] line-clamp-2">
                      {tool.desc}
                    </p>
                  </div>

                  {/* 하단: 화살표 아이콘 */}
                  <div className="self-end mt-2">
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1 text-[#222222] dark:text-[#EAEAEA]">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          </div>
        ))}

        {/* 하단 안내 섹션 */}
        <section className="pt-8 md:pt-10 border-t-4 border-[#222222] dark:border-[#444444]">
          <div className="border-2 border-[#222222] dark:border-[#444444] border-l-4 md:border-l-8 bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-4 md:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start transition-colors">
            <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">info</span>
            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#EAEAEA]">기능 제안 안내</h4>
              <p className="text-sm mt-1 text-[#666666] dark:text-[#A0A0A0]">
                실무에 필요한 새로운 도구가 있으신가요? 커뮤니티의 <strong className="text-[#222222] dark:text-[#EAEAEA]">#기능제안</strong> 태그를 사용하여 의견을 남겨주세요. 모든 기능은 무료로 제공됩니다.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}