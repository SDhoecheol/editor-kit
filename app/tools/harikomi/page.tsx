"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { PDFDocument, rgb } from "pdf-lib";

export default function HarikomiPage() {
  const [tab, setTab] = useState<"card" | "saddle">("card");

  const [fileName, setFileName] = useState<string | null>(null);
  const [filePages, setFilePages] = useState<number>(0);
  const [pdfW, setPdfW] = useState<number>(0);
  const [pdfH, setPdfH] = useState<number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const [sides, setSides] = useState<1 | 2>(2);
  const [cropMarks, setCropMarks] = useState<boolean>(true);
  const [layoutOption, setLayoutOption] = useState<"standard" | "2up" | "5up" | "10up">("standard");

  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullPdfBytes, setFullPdfBytes] = useState<any>(null);

  const totalDesigns = sides === 2 ? Math.floor(filePages / 2) : filePages;

  // 인원수 부족 시 레이아웃 옵션 자동 다운그레이드
  useEffect(() => {
    if (tab === "card" && totalDesigns > 0) {
      if (layoutOption === "10up" && totalDesigns < 10) setLayoutOption(totalDesigns >= 5 ? "5up" : totalDesigns >= 2 ? "2up" : "standard");
      else if (layoutOption === "5up" && totalDesigns < 5) setLayoutOption(totalDesigns >= 2 ? "2up" : "standard");
      else if (layoutOption === "2up" && totalDesigns < 2) setLayoutOption("standard");
    }
  }, [totalDesigns, layoutOption, tab]);

  // 스마트 조판 최적화 알고리즘
  const { sheetsConfig, sheetStartIdx, calculatedTotalSheets, layoutSummary } = useMemo(() => {
    const config: string[] = [];
    const startIdx: number[] = [];
    let tSheets = 1;
    const layoutCounts = { "10up": 0, "5up": 0, "2up": 0, "standard": 0 };

    if (tab === "card" && totalDesigns > 0) {
      let remaining = totalDesigns;
      const caps = [
        { id: "10up", val: 10 },
        { id: "5up", val: 5 },
        { id: "2up", val: 2 },
        { id: "standard", val: 1 }
      ];
      
      const startIndex = caps.findIndex(c => c.id === layoutOption);
      let currentIdx = 0;

      for (let i = startIndex; i < caps.length; i++) {
        const cap = caps[i];
        const count = Math.floor(remaining / cap.val); 
        for (let j = 0; j < count; j++) {
          config.push(cap.id);
          startIdx.push(currentIdx);
          layoutCounts[cap.id as keyof typeof layoutCounts]++;
          currentIdx += cap.val;
        }
        remaining %= cap.val;
      }
      tSheets = config.length;
    } else if (tab === "saddle" && filePages > 0) {
      const paddedPages = Math.ceil(filePages / 4) * 4;
      tSheets = paddedPages / 4;
    }

    // 일반인이 이해하기 쉬운 용어로 요약 텍스트 변경
    const summaryParts = [];
    if (layoutCounts["10up"]) summaryParts.push(`10명 ${layoutCounts["10up"]}판`);
    if (layoutCounts["5up"]) summaryParts.push(`5명 ${layoutCounts["5up"]}판`);
    if (layoutCounts["2up"]) summaryParts.push(`2명 ${layoutCounts["2up"]}판`);
    if (layoutCounts["standard"]) summaryParts.push(`1명 ${layoutCounts["standard"]}판`);

    return { 
      sheetsConfig: config, 
      sheetStartIdx: startIdx, 
      calculatedTotalSheets: tSheets,
      layoutSummary: summaryParts.join(" + ")
    };
  }, [tab, totalDesigns, layoutOption, filePages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        setFileBuffer(buffer);
        const pdfDoc = await PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPageCount();
        const { width, height } = pdfDoc.getPages()[0].getSize();
        
        setPdfW(Math.round(width / 2.83465));
        setPdfH(Math.round(height / 2.83465));
        setFilePages(pageCount);
        setCurrentSheet(0);
        setPreviewSide("front");
      } catch (err) {
        alert("PDF 로드 오류가 발생했습니다.");
        removeFile();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null); setFileBuffer(null); setFilePages(0); setPdfW(0); setPdfH(0);
    Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls({}); setFullPdfBytes(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getCardDesignForSlot = (sheet: number, slot: number, isBack: boolean) => {
    if (totalDesigns === 0 || sheet >= sheetsConfig.length) return null;
    
    const layout = sheetsConfig[sheet]; 
    const startIdx = sheetStartIdx[sheet]; 
    const mappedSlot = isBack ? (slot < 5 ? slot + 5 : slot - 5) : slot;
    let designOffset = 0;

    if (layout === "standard") designOffset = 0;
    else if (layout === "2up") designOffset = mappedSlot < 5 ? 0 : 1;
    else if (layout === "5up") designOffset = Math.floor(mappedSlot / 2);
    else if (layout === "10up") designOffset = mappedSlot;

    const designIdx = startIdx + designOffset;
    if (designIdx >= totalDesigns) return null;
    const pageNum = designIdx * sides + (isBack && sides === 2 ? 1 : 0) + 1;
    return { designIdx, pageNum };
  };

  const getSaddlePageForSlot = (sheet: number, slot: number, isBack: boolean) => {
    const paddedPages = Math.ceil(filePages / 4) * 4;
    if (!isBack) return slot === 0 ? paddedPages - (2 * sheet) : (2 * sheet) + 1;
    else return slot === 0 ? (2 * sheet) + 2 : paddedPages - 1 - (2 * sheet);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!fileBuffer || filePages === 0) {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls({}); setFullPdfBytes(null);
      return;
    }
    
    setIsGenerating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      try {
        const srcDoc = await PDFDocument.load(fileBuffer);
        const srcPages = srcDoc.getPages();
        const MM_TO_PT = 2.83465;
        const markColor = rgb(0.1, 0.1, 0.1);

        const drawSheet = async (doc: PDFDocument, sheetIdx: number, isBack: boolean) => {
          if (tab === "card") {
            const sheetW = 210 * MM_TO_PT; const sheetH = 297 * MM_TO_PT;
            const itemW = pdfW * MM_TO_PT; const itemH = pdfH * MM_TO_PT;
            const offsetX = (sheetW - (itemW * 2)) / 2; const offsetY = (sheetH - (itemH * 5)) / 2;
            const page = doc.addPage([sheetW, sheetH]);

            for (let r = 0; r < 5; r++) {
              for (let c = 0; c < 2; c++) {
                const slot = c * 5 + r;
                const designInfo = getCardDesignForSlot(sheetIdx, slot, isBack);
                if (designInfo && designInfo.pageNum - 1 < srcPages.length) {
                  const x = offsetX + (c * itemW); const y = sheetH - offsetY - ((r + 1) * itemH);
                  const embeddedPage = await doc.embedPage(srcPages[designInfo.pageNum - 1]);
                  page.drawPage(embeddedPage, { x, y, width: itemW, height: itemH });
                }
              }
            }

            if (cropMarks) {
              const b_pt = 1 * MM_TO_PT; const l = 5 * MM_TO_PT; const str = 0.5;
              const gridLeft = offsetX; const gridRight = offsetX + (2 * itemW);
              const gridBottom = sheetH - offsetY - (5 * itemH); const gridTop = sheetH - offsetY;

              const xCuts = [];
              for(let c=0; c<2; c++) {
                xCuts.push(gridLeft + c*itemW + b_pt);
                xCuts.push(gridLeft + c*itemW + itemW - b_pt);
              }
              const yCuts = [];
              for(let r=0; r<5; r++) {
                const y_pt = sheetH - offsetY - ((r + 1) * itemH);
                yCuts.push(y_pt + b_pt);
                yCuts.push(y_pt + itemH - b_pt);
              }

              const drawL = (sx: number, sy: number, ex: number, ey: number) => page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: str, color: markColor });

              xCuts.forEach(x => { drawL(x, gridTop, x, gridTop + l); drawL(x, gridBottom, x, gridBottom - l); });
              yCuts.forEach(y => { drawL(gridLeft, y, gridLeft - l, y); drawL(gridRight, y, gridRight + l, y); });
            }
          } else {
            const itemW = pdfW * MM_TO_PT; 
            const itemH = pdfH * MM_TO_PT;
            const margin_pt = 15 * MM_TO_PT; 
            const sheetW = (itemW * 2) + (margin_pt * 2); 
            const sheetH = itemH + (margin_pt * 2);
            const page = doc.addPage([sheetW, sheetH]);
            
            for (let c = 0; c < 2; c++) {
              const pageNum = getSaddlePageForSlot(sheetIdx, c, isBack);
              if (pageNum <= srcPages.length) {
                const embeddedPage = await doc.embedPage(srcPages[pageNum - 1]);
                page.drawPage(embeddedPage, { x: margin_pt + (c * itemW), y: margin_pt, width: itemW, height: itemH });
              }
            }

            if (cropMarks) {
              const b_pt = 3 * MM_TO_PT; const l = 5 * MM_TO_PT; const str = 0.5;
              const left = margin_pt; const right = margin_pt + itemW * 2;
              const top = margin_pt + itemH; const bottom = margin_pt; const center = margin_pt + itemW;
              const drawL = (sx: number, sy: number, ex: number, ey: number) => page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: str, color: markColor });

              drawL(left + b_pt, top, left + b_pt, top + l); drawL(left, top - b_pt, left - l, top - b_pt);
              drawL(right - b_pt, top, right - b_pt, top + l); drawL(right, top - b_pt, right + l, top - b_pt);
              drawL(left + b_pt, bottom, left + b_pt, bottom - l); drawL(left, bottom + b_pt, left - l, bottom + b_pt);
              drawL(right - b_pt, bottom, right - b_pt, bottom - l); drawL(right, bottom + b_pt, right + l, bottom + b_pt);
              drawL(center, top, center, top + l); drawL(center, bottom, center, bottom - l);
            }
          }
        };

        const newPreviewUrls: Record<string, string> = {};
        for (let s = 0; s < calculatedTotalSheets; s++) {
          const preFrontDoc = await PDFDocument.create();
          await drawSheet(preFrontDoc, s, false);
          const fBytes = await preFrontDoc.save();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newPreviewUrls[`${s}-front`] = URL.createObjectURL(new Blob([fBytes as any], { type: 'application/pdf' }));

          if (sides === 2 || tab === "saddle") {
            const preBackDoc = await PDFDocument.create();
            await drawSheet(preBackDoc, s, true);
            const bBytes = await preBackDoc.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newPreviewUrls[`${s}-back`] = URL.createObjectURL(new Blob([bBytes as any], { type: 'application/pdf' }));
          }
        }
        
        setPreviewUrls(prev => {
          Object.values(prev).forEach(u => URL.revokeObjectURL(u));
          return newPreviewUrls;
        });

        const fullDoc = await PDFDocument.create();
        for (let s = 0; s < calculatedTotalSheets; s++) {
          await drawSheet(fullDoc, s, false);
          if (sides === 2 || tab === "saddle") await drawSheet(fullDoc, s, true);
        }
        setFullPdfBytes(await fullDoc.save());

      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }, 400); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileBuffer, tab, layoutOption, sides, cropMarks, calculatedTotalSheets, filePages, pdfW, pdfH]);

  const handleDownload = () => {
    if (!fullPdfBytes || !fileName) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = new Blob([fullPdfBytes as any], { type: 'application/pdf' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const modeStr = tab === "saddle" ? "중철제본" : "명함하리꼬미";
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_${modeStr}.pdf`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 02
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄판 자동 터잡기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            하리꼬미 조판
          </h1>
        </div>

        <div className="flex border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] overflow-hidden">
          <button 
            onClick={() => { setTab("card"); setFilePages(0); setFileName(null); setFileBuffer(null); }} 
            className={`px-6 py-3 font-bold text-sm border-r-2 border-[#222222] dark:border-[#444444] transition-colors flex items-center gap-2 ${tab === 'card' ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span> 명함 하리꼬미
          </button>
          <button 
            onClick={() => { setTab("saddle"); setFilePages(0); setFileName(null); setFileBuffer(null); }} 
            className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${tab === 'saddle' ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_stories</span> 중철 하리꼬미
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-[#222222] dark:border-[#444444] p-6 relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input type="file" id="file-upload" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {!fileName ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-[#222222] dark:text-[#EAEAEA]">upload_file</span>
                <p className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">PDF 원고 업로드</p>
                <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">클릭하거나 드래그하여 첨부</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 z-20 relative">
                <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">picture_as_pdf</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] truncate">{fileName}</p>
                  <p className="text-xs font-mono text-[#666666] dark:text-[#A0A0A0] mt-0.5">{filePages}p | {pdfW}x{pdfH}mm</p>
                </div>
                <button onClick={removeFile} className="text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] w-8 h-8 rounded-none">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">tune</span> {tab === 'card' ? '명함 설정' : '중철 설정'}
            </div>
            <div className="p-5 space-y-5">
              
              <div className="grid grid-cols-2 gap-0 border-2 border-[#222222] dark:border-[#444444]">
                <button onClick={() => { setSides(1); setPreviewSide("front"); }} className={`py-3 flex flex-col items-center justify-center transition-all border-r-2 border-[#222222] dark:border-[#444444] ${sides === 1 ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'bg-white dark:bg-[#1E1E1E] text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}>
                  <span className="font-bold text-sm">단면</span>
                  <span className="text-[10px] opacity-80 mt-1 font-mono">{tab === 'card' ? '1페이지 1명' : '단면 인쇄'}</span>
                </button>
                <button onClick={() => setSides(2)} className={`py-3 flex flex-col items-center justify-center transition-all ${sides === 2 ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'bg-white dark:bg-[#1E1E1E] text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}>
                  <span className="font-bold text-sm">양면</span>
                  <span className="text-[10px] opacity-80 mt-1 font-mono">{tab === 'card' ? '2페이지 1명' : '양면 인쇄'}</span>
                </button>
              </div>
              
              <div className="flex items-center justify-between border-2 border-[#E5E4E0] dark:border-[#333333] p-4 bg-[#F5F4F0] dark:bg-[#121212]">
                <div>
                  <p className="font-bold text-sm text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">crop_free</span> 재단선 표시
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={cropMarks} onChange={(e) => setCropMarks(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#A0A0A0] dark:bg-[#666666] peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-[#222222] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#222222] after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-[#222222] dark:peer-checked:bg-[#EAEAEA]"></div>
                </label>
              </div>
            </div>
          </div>

          {tab === "card" && (
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
              <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] flex items-center justify-between">
                <div className="font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span> 배치 옵션
                </div>
                <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] text-[10px] font-bold px-2 py-0.5 tracking-widest">총 {totalDesigns}명</span>
              </div>
              <div className="p-5 space-y-3">
                {/* ⭐️ 일반인이 이해하기 쉬운 용어로 직관적으로 변경했습니다 */}
                {[
                  { id: "standard", title: "1명 단독 인쇄", desc: "1판에 1명만 인쇄 (독판)", cap: 1 },
                  { id: "2up", title: "2명 반반 인쇄", desc: "1판에 2명을 반반 나눠서 인쇄", cap: 2 },
                  { id: "5up", title: "5명 모아 찍기", desc: "1판에 5명을 모아서 인쇄", badge: "추천", cap: 5 },
                  { id: "10up", title: "10명 모아 찍기", desc: "1판에 10명을 꽉 채워 인쇄", badge: "추천", cap: 10 }
                ].map((opt) => {
                  const isDisabled = totalDesigns > 0 && totalDesigns < opt.cap;
                  const isActive = layoutOption === opt.id;
                  
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => { if(!isDisabled) { setLayoutOption(opt.id as any); setCurrentSheet(0); } }} 
                      disabled={isDisabled}
                      className={`w-full text-left p-3 border-2 transition-all flex items-center justify-between ${
                        isDisabled 
                        ? 'border-[#E5E4E0] dark:border-[#333333] opacity-40 cursor-not-allowed bg-gray-50 dark:bg-[#121212]' 
                        : isActive 
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-[#1A233A]' 
                            : 'border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* ⭐️ 어떤 버튼이 눌렸는지 100% 확실하게 보여주는 라디오 버튼 UI */}
                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-blue-600 dark:border-blue-500' : 'border-[#A0A0A0] dark:border-[#666666]'}`}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm flex items-center gap-2 ${isActive ? 'text-blue-800 dark:text-blue-300' : 'text-[#222222] dark:text-[#EAEAEA]'}`}>
                            {opt.title} {opt.badge && <span className={`${isActive ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212]'} text-[10px] px-1.5 py-0.5`}>{opt.badge}</span>}
                          </p>
                          <p className={`text-xs mt-1 ${isActive ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-[#A0A0A0] dark:text-[#666666]'}`}>{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {totalDesigns > 0 && layoutSummary && (
                <div className="border-t-2 border-[#222222] dark:border-[#444444] bg-[#222222] dark:bg-[#EAEAEA] p-4 text-[#F5F4F0] dark:text-[#121212] flex items-start gap-3">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <div>
                    <p className="text-sm font-black">스마트 조판 최적화 완료</p>
                    <p className="text-[11px] font-bold mt-1 opacity-90 leading-relaxed">
                      인원수({totalDesigns}명)에 맞춰 <br />
                      <strong className="underline underline-offset-4 decoration-2">{layoutSummary}</strong> 으로<br /> 빈틈없이 자동 분배되었습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleDownload} 
            disabled={!fullPdfBytes || isGenerating} 
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span className="material-symbols-outlined text-[24px]">download</span> 전체 인쇄용 PDF 저장
          </button>
        </div>

        {/* ⭐️ 우측 패널: PDF 실시간 뷰어 (그림자 완전 제거!) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] flex flex-col h-[800px]">
          
          <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[#F5F4F0] font-black tracking-widest text-xs">PREVIEW</span>
              {(sides === 2 || tab === "saddle") && (
                <div className="flex border-2 border-[#F5F4F0] dark:border-[#444444]">
                  <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 text-xs font-bold transition-all border-r-2 border-[#F5F4F0] dark:border-[#444444] ${previewSide === 'front' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>앞면</button>
                  <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 text-xs font-bold transition-all ${previewSide === 'back' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>뒷면</button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentSheet(Math.max(0, currentSheet - 1))} disabled={currentSheet === 0} className="text-[#A0A0A0] hover:text-[#F5F4F0] disabled:opacity-30 flex items-center">
                <span className="material-symbols-outlined text-[24px]">chevron_left</span>
              </button>
              <span className="text-sm font-black text-[#F5F4F0] w-24 text-center font-mono">Sheet {currentSheet + 1}/{calculatedTotalSheets}</span>
              <button onClick={() => setCurrentSheet(Math.min(calculatedTotalSheets - 1, currentSheet + 1))} disabled={currentSheet === calculatedTotalSheets - 1} className="text-[#A0A0A0] hover:text-[#F5F4F0] disabled:opacity-30 flex items-center">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-5xl animate-spin mb-4">settings</span>
                <p className="text-white font-black tracking-widest text-lg drop-shadow-md">렌더링 중...</p>
              </div>
            )}
            
            {previewUrls[`${currentSheet}-${previewSide}`] ? (
              <div className="w-full h-full p-4 bg-[#121212]">
                <iframe src={`${previewUrls[`${currentSheet}-${previewSide}`]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-2 border-[#444444] bg-white" title="Imposed Preview" />
              </div>
            ) : (
              <div className="text-[#A0A0A0] dark:text-[#666666] text-center">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">description</span>
                <p className="font-bold text-sm tracking-widest">PDF 원고를 업로드하면 조판 결과가 나타납니다.</p>
              </div>
            )}
          </div>
          
          <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] p-4 flex justify-center items-center shrink-0">
            <p className="text-[#666666] dark:text-[#A0A0A0] text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              배열을 확인하신 후 좌측 하단의 '인쇄용 PDF 저장' 버튼을 눌러주세요.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}