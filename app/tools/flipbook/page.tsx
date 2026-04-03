"use client";

import { useState, useRef, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";

// 🔥 TypeScript 억지 에러 방지
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlipBook = HTMLFlipBook as any;

const pdfjsVersion = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

// 플립북에 들어갈 개별 페이지 컴포넌트
const Page = forwardRef<HTMLDivElement, { imageUrl: string; number: number }>((props, ref) => {
  return (
    <div className="bg-white shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] flex items-center justify-center overflow-hidden border-r border-slate-200/50" ref={ref}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.imageUrl} alt={`Page ${props.number}`} className="w-full h-full object-contain" />
    </div>
  );
});
Page.displayName = "Page";

export default function FlipbookPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  
  // 책 렌더링 사이즈 (컨테이너에 꽉 차게 조금 더 키웠습니다)
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
            
            // 첫 페이지 해상도를 기준으로 3D 책의 가로세로 비율 결정
            if (i === 1) {
              const viewport = page.getViewport({ scale: 1.0 });
              const ratio = viewport.width / viewport.height;
              setBookH(650); // 높이 상향
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
              fbCtx.fillStyle = "#f87171"; fbCtx.fillRect(0,0,400,600);
              fbCtx.fillStyle = "white"; fbCtx.font = "20px sans-serif";
              fbCtx.fillText("Page Render Error", 100, 300);
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
    <div className="bg-slate-50 min-h-screen py-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      <div className="max-w-7xl mx-auto px-4">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-blue-600">menu_book</span>
          2.5D 플립북 목업 뷰어
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-dashed border-2 hover:border-blue-400 transition-colors relative">
              <input type="file" id="mockup-file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!fileName ? (
                <div className="text-center pointer-events-none">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-blue-500 text-2xl">upload_file</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">책자 PDF 업로드</p>
                  <p className="text-xs text-slate-400 mt-1">클릭하거나 드래그하여 첨부</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 z-20 relative">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-emerald-500">task</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">총 {images.length}페이지</p>
                  </div>
                  <button onClick={resetFile} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">info</span> 이용 안내
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 mt-4">
                <li>• 다수의 페이지가 포함된 <b>내지 PDF</b>를 올려주세요.</li>
                <li>• 우측 뷰어의 <b>모서리를 드래그</b>하거나 클릭하면 실제 책처럼 넘어갑니다.</li>
                <li>• <b>[TIP]</b> 양면 펼침면 디자인을 검수하기에 최적화되어 있습니다.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 h-[800px] flex flex-col relative overflow-hidden">
            
            <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-bold tracking-widest text-xs">MOCKUP PREVIEW</span>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              
              {isGenerating && (
                <div className="absolute inset-0 bg-[#1e293b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin mb-4">settings_suggest</span>
                  <p className="text-white font-bold text-lg drop-shadow-md">PDF를 3D 플립북으로 변환 중...</p>
                  
                  <div className="w-64 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">{progress}%</p>
                </div>
              )}

              {/* 🌟 튜닝 완료: 무조건 양면 고정 & 촌스러운 광택 제거 */}
              {images.length > 0 && !isGenerating ? (
                <div className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <FlipBook 
                    width={bookW} 
                    height={bookH} 
                    size="fixed"
                    minWidth={315}
                    maxWidth={bookW}
                    minHeight={400}
                    maxHeight={bookH}
                    drawShadow={true}
                    flippingTime={800}          /* 애니메이션 속도 약간 더 찰지게 변경 */
                    usePortrait={false}         /* 🔥 1번 해결: 무조건 양면 펼침(Spread) 모드로 강제 고정! */
                    startZIndex={0}
                    autoSize={true}
                    maxShadowOpacity={0.15}     /* 🔥 2번 해결: 0.5 -> 0.15 로 대폭 낮춰 싸구려 광택 제거 (무광 모조지 느낌) */
                    showCover={true}            /* 첫 페이지는 표지처럼 우측에 단면으로 표시 (책의 원리) */
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
                <div className="text-slate-500 text-center">
                  <span className="material-symbols-outlined text-6xl mb-3 opacity-30">auto_stories</span>
                  <p className="font-bold text-sm">PDF를 업로드하면 가상의 책이 생성됩니다.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}