"use client";

import { useState, useRef, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";

// TypeScript 억지 에러 방지
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlipBook = HTMLFlipBook as any;

const pdfjsVersion = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

// 가제본에 들어갈 개별 페이지 컴포넌트
const Page = forwardRef<HTMLDivElement, { imageUrl: string; number: number }>((props, ref) => {
  return (
    <div className="bg-white flex items-center justify-center overflow-hidden border-r border-[#E5E4E0] dark:border-[#333333]" ref={ref}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.imageUrl} alt={`${props.number}페이지`} className="w-full h-full object-contain" />
    </div>
  );
});
Page.displayName = "Page";

export default function FlipbookPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  
  // 책 렌더링 사이즈
  const [bookW, setBookW] = useState<number>(450);
  const [bookH, setBookH] = useState<number>(650);

  const flipBookRef = useRef(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');

    setFileName(file.name);
    setIsGenerating(true);
    setProgress(0);
    setImages([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`
        });
        
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const newImages: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            
            // 첫 페이지 해상도를 기준으로 입체 책의 가로세로 비율 결정
            if (i === 1) {
              const viewport = page.getViewport({ scale: 1.0 });
              const ratio = viewport.width / viewport.height;
              setBookH(650);
              setBookW(Math.round(650 * ratio));
            }

            // 고화질 렌더링
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            
            newImages.push(canvas.toDataURL("image/jpeg", 0.8));
          } catch (pageErr) {
            console.error(`${i}페이지 렌더링 실패:`, pageErr);
            const fallbackCanvas = document.createElement("canvas");
            fallbackCanvas.width = 400; fallbackCanvas.height = 600;
            const fbCtx = fallbackCanvas.getContext("2d");
            if (fbCtx) {
              fbCtx.fillStyle = "#E5E4E0"; fbCtx.fillRect(0,0,400,600);
              fbCtx.fillStyle = "#222222"; fbCtx.font = "bold 20px sans-serif";
              fbCtx.fillText("페이지 렌더링 오류", 100, 300);
              newImages.push(fallbackCanvas.toDataURL("image/jpeg", 0.5));
            }
          }
          setProgress(Math.round((i / numPages) * 100));
        }

        setImages(newImages);
      } catch (err) {
        console.error(err);
        alert("PDF 렌더링 중 오류가 발생했습니다.");
        resetFile();
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetFile = () => {
    setFileName(null);
    setImages([]);
    setProgress(0);
    const fileInput = document.getElementById('mockup-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      {/* 헤더 영역 */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 06
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              PDF 책자 입체 검수
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            웹 가제본 뷰어
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 좌측 패널: 업로드 및 안내 */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-[#222222] dark:border-[#444444] p-6 relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input type="file" id="mockup-file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {!fileName ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-[#222222] dark:text-[#EAEAEA]">menu_book</span>
                <p className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">내지 PDF 원고 업로드</p>
                <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">클릭하거나 드래그하여 첨부</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 z-20 relative">
                <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">task</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] truncate">{fileName}</p>
                  <p className="text-xs font-mono text-[#666666] dark:text-[#A0A0A0] mt-0.5">총 {images.length}페이지</p>
                </div>
                <button onClick={resetFile} className="text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] w-8 h-8 rounded-none">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
          </div>

          <div className="border-2 border-[#222222] dark:border-[#444444] border-l-8 bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-6 flex gap-4 items-start transition-colors">
            <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">info</span>
            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#EAEAEA]">이용 안내</h4>
              <ul className="text-sm text-[#666666] dark:text-[#A0A0A0] space-y-2 mt-2 leading-relaxed">
                <li>• 다수의 페이지가 포함된 <strong className="text-[#222222] dark:text-[#EAEAEA]">단면 내지 PDF</strong>를 올려주세요.</li>
                <li>• 우측 화면의 <strong className="text-[#222222] dark:text-[#EAEAEA]">모서리를 드래그</strong>하거나 클릭하면 실제 책처럼 넘어갑니다.</li>
                <li>• 고객에게 시안을 확인받거나, 양면 펼침면(스프레드) 디자인을 검수할 때 유용합니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 우측 패널: 가제본 미리보기 화면 (디자인 통일) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[800px]">
          
          {/* 다크 헤더 */}
          <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[#F5F4F0] font-black tracking-widest text-xs">가제본 미리보기</span>
            </div>
          </div>

          <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
            
            {/* 로딩 화면 (브루탈리즘 스타일 진행률 바) */}
            {isGenerating && (
              <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <span className="material-symbols-outlined text-[#F5F4F0] text-5xl animate-spin mb-4">autorenew</span>
                <p className="text-[#F5F4F0] font-black tracking-widest text-lg mb-6">PDF를 입체 책자로 변환 중입니다...</p>
                
                <div className="w-64 h-4 bg-[#111111] border-2 border-[#F5F4F0] relative">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-blue-400 font-mono font-bold mt-2">{progress}%</p>
              </div>
            )}

            {/* 책자 뷰어 */}
            {images.length > 0 && !isGenerating ? (
              <div className="flex items-center justify-center">
                <FlipBook 
                  width={bookW} 
                  height={bookH} 
                  size="fixed"
                  minWidth={315}
                  maxWidth={bookW}
                  minHeight={400}
                  maxHeight={bookH}
                  drawShadow={true}
                  flippingTime={800}          
                  usePortrait={false}         /* 양면 펼침 모드 고정 */
                  startZIndex={0}
                  autoSize={true}
                  maxShadowOpacity={0.15}     /* 무광 느낌으로 그림자 최소화 */
                  showCover={true}            /* 첫 페이지는 표지 취급 */
                  mobileScrollSupport={true}
                  ref={flipBookRef}
                  className="flipbook-wrapper"
                  style={{ margin: "0 auto" }}
                >
                  {images.map((img, index) => (
                    <Page key={index} imageUrl={img} number={index + 1} />
                  ))}
                </FlipBook>
              </div>
            ) : !isGenerating && (
              <div className="text-[#A0A0A0] dark:text-[#666666] text-center">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">auto_stories</span>
                <p className="font-bold text-sm tracking-widest">PDF 원고를 업로드하면 가상의 책이 생성됩니다.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}