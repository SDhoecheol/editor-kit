"use client";

import { useState, useEffect, useRef } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const paperSizes: Record<string, { name: string; w: number; h: number }> = {
  guk: { name: '국전지', w: 939, h: 636 },
  '4x6': { name: '4x6전지', w: 1091, h: 788 },
  guk_half: { name: '국반전지', w: 636, h: 469 },
  '4x6_half': { name: '4x6반전지', w: 788, h: 545 }
};

// 16P 무선/양장 접지 배열
const layout16 = {
  front: [
    [ { p: 15, r: true }, { p: 0, r: true }, { p: 3, r: true }, { p: 12, r: true } ],
    [ { p: 8,  r: false }, { p: 7, r: false }, { p: 4, r: false }, { p: 11, r: false } ]
  ],
  back: [
    [ { p: 13, r: true }, { p: 2, r: true }, { p: 1, r: true }, { p: 14, r: true } ],
    [ { p: 10, r: false }, { p: 5, r: false }, { p: 6, r: false }, { p: 9,  r: false } ]
  ]
};

export default function YieldCalcPage() {
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [bleed, setBleed] = useState<number>(3);
  const [pages, setPages] = useState<number>(1);
  const [sides, setSides] = useState<number>(2);
  const [qty, setQty] = useState<number>(1000); // ⭐️ 누락되었던 수량 입력 기능 추가
  const [paperPref, setPaperPref] = useState<string>("auto");
  
  const [impositionMode, setImpositionMode] = useState<"repeat" | "signature16">("repeat");
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  
  const [fullPdfUrl, setFullPdfUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentSheetIdx, setCurrentSheetIdx] = useState<number>(0);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [totalSheets, setTotalSheets] = useState<number>(1);

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
        const firstPage = pdfDoc.getPages()[0];
        const { width: ptWidth, height: ptHeight } = firstPage.getSize();
        
        setWidth(Math.round(ptWidth / 2.83465));
        setHeight(Math.round(ptHeight / 2.83465));
        setPages(pageCount);
        
        if (pageCount >= 8) {
          setImpositionMode("signature16");
          setTotalSheets(Math.ceil(pageCount / 16));
        } else {
          setImpositionMode("repeat");
          setTotalSheets(Math.ceil(pageCount / sides));
        }
        setCurrentSheetIdx(0);
        setPreviewSide("front");
        
      } catch (err) {
        alert("PDF 분석 오류. 파일이 손상되었거나 암호화되었을 수 있습니다.");
        resetFile();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetFile = () => {
    setFileName(null); setFileBuffer(null); setWidth(""); setHeight(""); setPages(1); 
    if (fullPdfUrl) URL.revokeObjectURL(fullPdfUrl);
    Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    setFullPdfUrl(null);
    setPreviewUrls({});
    const fileInput = document.getElementById('yc-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    if (!width || !height || !qty) return setResult(null);

    const jobW = Number(width) + (bleed * 2);
    const jobH = Number(height) + (bleed * 2);
    let bestPaperKey: string | null = null;
    let bestSetup = { yield: -1, efficiency: -1, cols: 0, rows: 0, rotated: false, w: 0, h: 0, name: "" };

    const papersToTest = paperPref === 'auto' ? Object.keys(paperSizes) : [paperPref];

    papersToTest.forEach(key => {
      const paper = paperSizes[key];
      const cols1 = Math.floor(paper.w / jobW); const rows1 = Math.floor(paper.h / jobH); const yield1 = cols1 * rows1;
      const cols2 = Math.floor(paper.w / jobH); const rows2 = Math.floor(paper.h / jobW); const yield2 = cols2 * rows2;

      let currentSetup;
      if (impositionMode === "signature16") {
        if (cols1 >= 4 && rows1 >= 2) currentSetup = { yield: 8, cols: 4, rows: 2, rotated: false, w: paper.w, h: paper.h, name: paper.name, efficiency: (8 * jobW * jobH) / (paper.w * paper.h) * 100 };
        else if (cols2 >= 4 && rows2 >= 2) currentSetup = { yield: 8, cols: 4, rows: 2, rotated: true, w: paper.w, h: paper.h, name: paper.name, efficiency: (8 * jobW * jobH) / (paper.w * paper.h) * 100 };
        else currentSetup = { yield: 0, cols: 0, rows: 0, rotated: false, w: paper.w, h: paper.h, name: paper.name, efficiency: 0 };
      } else {
        if (yield1 >= yield2) currentSetup = { yield: yield1, cols: cols1, rows: rows1, rotated: false, w: paper.w, h: paper.h, name: paper.name, efficiency: yield1 > 0 ? ((yield1 * jobW * jobH) / (paper.w * paper.h)) * 100 : 0 };
        else currentSetup = { yield: yield2, cols: cols2, rows: rows2, rotated: true, w: paper.w, h: paper.h, name: paper.name, efficiency: yield2 > 0 ? ((yield2 * jobW * jobH) / (paper.w * paper.h)) * 100 : 0 };
      }

      if (currentSetup.yield > 0 && (!bestPaperKey || currentSetup.yield > bestSetup.yield || (currentSetup.yield === bestSetup.yield && currentSetup.efficiency > bestSetup.efficiency))) {
        bestPaperKey = key; bestSetup = currentSetup;
      }
    });

    if (!bestPaperKey) return setResult(null);

    const actualSheets = Math.ceil((qty * pages) / (bestSetup.yield * sides));
    const neededSheets = Math.ceil(actualSheets * 1.1); 
    setResult({ ...bestSetup, jobW, jobH, actualSheets, actualReams: actualSheets / 500, neededSheets, neededReams: neededSheets / 500 });
    
    if (impositionMode === "signature16") setTotalSheets(Math.ceil(pages / 16));
    else setTotalSheets(Math.ceil(pages / sides));

  }, [width, height, bleed, pages, sides, qty, paperPref, impositionMode]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createSheet = async (targetDoc: PDFDocument, srcPages: any[], sheetIdx: number, side: "front" | "back") => {
    const MM_TO_PT = 2.83465;
    const ptW = result.w * MM_TO_PT;
    const ptH = result.h * MM_TO_PT;
    const itemW_pt = (result.rotated ? result.jobH : result.jobW) * MM_TO_PT;
    const itemH_pt = (result.rotated ? result.jobW : result.jobH) * MM_TO_PT;
    
    const offsetX_pt = ((result.w - (result.cols * (result.rotated ? result.jobH : result.jobW))) / 2) * MM_TO_PT;
    const offsetY_pt = ((result.h - (result.rows * (result.rotated ? result.jobW : result.jobH))) / 2) * MM_TO_PT;
    const markColor = rgb(0.1, 0.1, 0.1); 

    const page = targetDoc.addPage([ptW, ptH]);

    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        const x_pt = offsetX_pt + (c * itemW_pt);
        const y_pt = ptH - offsetY_pt - ((r + 1) * itemH_pt);
        
        let srcPageIdx = 0;
        let rotate180 = false;

        if (impositionMode === "signature16") {
          const layout = side === "back" ? layout16.back : layout16.front;
          srcPageIdx = (sheetIdx * 16) + layout[r][c].p;
          rotate180 = layout[r][c].r;
        } else {
          srcPageIdx = (sheetIdx * sides) + (side === "back" ? 1 : 0);
        }

        if (srcPageIdx < srcPages.length) {
          const embeddedPage = await targetDoc.embedPage(srcPages[srcPageIdx]);
          
          let angle = 0;
          if (result.rotated) angle += 90;
          if (rotate180) angle += 180;
          angle = angle % 360;

          let drawX = x_pt;
          let drawY = y_pt;

          if (angle === 90) { drawX += itemW_pt; }
          else if (angle === 180) { drawX += itemW_pt; drawY += itemH_pt; }
          else if (angle === 270) { drawY += itemH_pt; }

          page.drawPage(embeddedPage, {
            x: drawX, y: drawY,
            width: result.jobW * MM_TO_PT, height: result.jobH * MM_TO_PT,
            rotate: degrees(angle),
          });
        }

        if (includeCropMarks && bleed > 0) {
          const b_pt = bleed * MM_TO_PT;
          const l = 5 * MM_TO_PT; 
          const stroke = 0.5;

          const tx = x_pt + b_pt;
          const ty = y_pt + b_pt;
          const tw = itemW_pt - 2*b_pt;
          const th = itemH_pt - 2*b_pt;

          const drawL = (sx: number, sy: number, ex: number, ey: number) => 
            page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: stroke, color: markColor });

          drawL(tx, ty - b_pt, tx, ty - b_pt - l);
          drawL(tx - b_pt, ty, tx - b_pt - l, ty);
          drawL(tx, ty + th + b_pt, tx, ty + th + b_pt + l);
          drawL(tx - b_pt, ty + th, tx - b_pt - l, ty + th);
          drawL(tx + tw, ty - b_pt, tx + tw, ty - b_pt - l);
          drawL(tx + tw + b_pt, ty, tx + tw + b_pt + l, ty);
          drawL(tx + tw, ty + th + b_pt, tx + tw, ty + th + b_pt + l);
          drawL(tx + tw + b_pt, ty + th, tx + tw + b_pt + l, ty + th);
        }
      }
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!result || !fileBuffer) {
      if (fullPdfUrl) URL.revokeObjectURL(fullPdfUrl);
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
      setFullPdfUrl(null);
      setPreviewUrls({});
      return;
    }
    
    setIsGenerating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      try {
        const srcDoc = await PDFDocument.load(fileBuffer);
        const srcPages = srcDoc.getPages();
        
        const fullDoc = await PDFDocument.create();
        for (let s = 0; s < totalSheets; s++) {
          await createSheet(fullDoc, srcPages, s, "front");
          if (sides === 2) await createSheet(fullDoc, srcPages, s, "back");
        }
        const fullBytes = await fullDoc.save();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullBlob = new Blob([fullBytes as any], { type: 'application/pdf' });
        const newFullUrl = URL.createObjectURL(fullBlob);

        const newPreviewUrls: Record<string, string> = {};
        for (let s = 0; s < totalSheets; s++) {
          const frontDoc = await PDFDocument.create();
          await createSheet(frontDoc, srcPages, s, "front");
          const frontBytes = await frontDoc.save();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newPreviewUrls[`${s}-front`] = URL.createObjectURL(new Blob([frontBytes as any], { type: 'application/pdf' }));

          if (sides === 2) {
            const backDoc = await PDFDocument.create();
            await createSheet(backDoc, srcPages, s, "back");
            const backBytes = await backDoc.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newPreviewUrls[`${s}-back`] = URL.createObjectURL(new Blob([backBytes as any], { type: 'application/pdf' }));
          }
        }
        
        setPreviewUrls(prev => {
          Object.values(prev).forEach(u => URL.revokeObjectURL(u));
          return newPreviewUrls;
        });
        setFullPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return newFullUrl;
        });

      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }, 500); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, fileBuffer, impositionMode, includeCropMarks, sides, totalSheets]);

  const getDownloadFileName = () => {
    if (!fileName) return "인쇄배치_결과.pdf";
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const modeStr = impositionMode === "signature16" ? "16P책자배치" : "반복배치";
    const sideStr = sides === 2 ? "양면" : "단면";
    return `${baseName}_${modeStr}_${sideStr}.pdf`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      {/* 헤더 영역 */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 03
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄 용지 및 배치 자동 계산
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            수율 계산기
          </h1>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 왼쪽 설정 패널 */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 transition-colors">
            <div className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-all mb-6">
              <input accept=".pdf" id="yc-file-input" type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!fileName ? (
                <div className="text-center px-4 pointer-events-none">
                  <span className="material-symbols-outlined text-3xl text-[#222222] dark:text-[#EAEAEA] mb-1">upload_file</span>
                  <p className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0]">PDF 원고를 첨부하세요</p>
                </div>
              ) : (
                <div className="w-full px-4 text-center z-20">
                  <p className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] truncate">{fileName}</p>
                  <button onClick={resetFile} className="mt-2 text-[11px] text-red-600 font-bold bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] px-3 py-1 hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:shadow-none">삭제 및 초기화</button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">가로 (mm)</label>
                <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">세로 (mm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="p-4 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2 text-sm tracking-widest">
              <span className="material-symbols-outlined text-[18px]">grid_view</span> 배치 방식 설정
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button 
                  onClick={() => setImpositionMode("repeat")} 
                  className={`py-3 px-2 text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${impositionMode === 'repeat' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-[#1A233A] text-blue-800 dark:text-blue-300' : 'border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#EAEAEA] text-[#666666] dark:text-[#A0A0A0]'}`}
                >
                  <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${impositionMode === 'repeat' ? 'border-blue-600 dark:border-blue-500' : 'border-[#A0A0A0]'}`}>
                    {impositionMode === 'repeat' && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />}
                  </div>
                  1장 반복 (명함/전단)
                </button>
                <button 
                  onClick={() => setImpositionMode("signature16")} 
                  className={`py-3 px-2 text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${impositionMode === 'signature16' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-[#1A233A] text-blue-800 dark:text-blue-300' : 'border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#EAEAEA] text-[#666666] dark:text-[#A0A0A0]'}`}
                >
                  <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${impositionMode === 'signature16' ? 'border-blue-600 dark:border-blue-500' : 'border-[#A0A0A0]'}`}>
                    {impositionMode === 'signature16' && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />}
                  </div>
                  16페이지 묶음 (책자)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">총 페이지 수 (p)</label>
                  <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" min="1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">인쇄면</label>
                  <select value={sides} onChange={(e) => { setSides(Number(e.target.value)); setPreviewSide("front"); }} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none cursor-pointer">
                    <option value={1}>단면 (한 쪽만 인쇄)</option>
                    <option value={2}>양면 (양 쪽 모두 인쇄)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">여백 (도련 / mm)</label>
                  <input type="number" value={bleed} onChange={(e) => setBleed(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">사용 전지 선택</label>
                  <select value={paperPref} onChange={(e) => setPaperPref(e.target.value)} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none cursor-pointer">
                    <option value="auto">자동 추천 (가장 효율적)</option>
                    <option value="guk">국전지 (939x636)</option>
                    <option value="4x6">4x6전지 (1091x788)</option>
                  </select>
                </div>
              </div>

              {/* ⭐️ 누락되어 있던 수량 입력 창 추가 */}
              <div>
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">제작 수량 (부 / 개)</label>
                <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-[#121212] text-blue-600 dark:text-blue-400 text-lg font-black outline-none focus:shadow-[4px_4px_0px_#2563eb] focus:-translate-y-1 transition-all" min="1" placeholder="예: 1000" />
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 뷰어 패널 */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 상단 3개 결과 요약 박스 (쉬운 용어 적용) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#222222] dark:bg-[#111111] border-2 border-[#222222] dark:border-[#444444] p-6 flex flex-col justify-center shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111]">
              <span className="text-[#A0A0A0] text-[10px] font-bold tracking-widest block mb-1">추천 종이 크기 및 효율</span>
              <h4 className="text-[#F5F4F0] font-black text-2xl">{result ? result.name : "-"}</h4>
              <p className="text-[#A0A0A0] text-sm mt-1 font-mono">{result ? `1장에 ${result.yield}개 배치 (${result.yield}절)` : "-"}</p>
            </div>
            
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-6 flex flex-col justify-center shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111]">
              <span className="text-[#666666] dark:text-[#A0A0A0] text-[10px] font-bold tracking-widest block mb-1">순수 필요 종이 (여유분 제외)</span>
              <div className="flex items-baseline gap-1">
                <h4 className="text-[#222222] dark:text-[#EAEAEA] font-black text-3xl tracking-tighter">{result ? result.actualReams.toFixed(3) : "0"}</h4>
                <span className="text-[#666666] dark:text-[#A0A0A0] font-bold text-sm">연(500장)</span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-[#1A233A] border-2 border-blue-600 dark:border-blue-500 p-6 flex flex-col justify-center shadow-[4px_4px_0px_#2563eb] dark:shadow-[4px_4px_0px_#3b82f6]">
              <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest block mb-1">최종 주문 종이 (여유분 10% 포함)</span>
              <div className="flex items-baseline gap-1">
                <h4 className="text-blue-800 dark:text-blue-300 font-black text-3xl tracking-tighter">{result ? result.neededReams.toFixed(3) : "0"}</h4>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">연(500장)</span>
              </div>
            </div>
          </div>

          {/* 중앙 미리보기 패널 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[700px] relative overflow-hidden transition-colors">
            
            <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex justify-between items-center border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
              <div className="flex items-center gap-6">
                <span className="text-xs font-black tracking-widest text-[#F5F4F0] flex items-center gap-2 uppercase">
                  <span className="material-symbols-outlined text-[16px]">visibility</span> 미리보기
                </span>
                
                {sides === 2 && (
                  <div className="flex border-2 border-[#F5F4F0] dark:border-[#444444]">
                    <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 text-xs font-bold transition-all border-r-2 border-[#F5F4F0] dark:border-[#444444] ${previewSide === 'front' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>앞면</button>
                    <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 text-xs font-bold transition-all ${previewSide === 'back' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>뒷면</button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-[#F5F4F0] cursor-pointer mr-4">
                  <input type="checkbox" checked={includeCropMarks} onChange={(e) => setIncludeCropMarks(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  재단선 긋기
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentSheetIdx(Math.max(0, currentSheetIdx - 1))} disabled={currentSheetIdx === 0} className="text-[#A0A0A0] hover:text-[#F5F4F0] disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <span className="text-sm font-black text-[#F5F4F0] w-20 text-center font-mono">{currentSheetIdx + 1} / {totalSheets} 판</span>
                  <button onClick={() => setCurrentSheetIdx(Math.min(totalSheets - 1, currentSheetIdx + 1))} disabled={currentSheetIdx === totalSheets - 1} className="text-[#A0A0A0] hover:text-[#F5F4F0] disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-[#2A2A2A] relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <span className="material-symbols-outlined text-white text-5xl animate-spin mb-4">settings</span>
                  <p className="text-white font-black tracking-widest text-lg drop-shadow-md">렌더링 중...</p>
                </div>
              )}
              
              {previewUrls[`${currentSheetIdx}-${previewSide}`] ? (
                <div className="w-full h-full p-4 bg-[#121212]">
                  <iframe src={`${previewUrls[`${currentSheetIdx}-${previewSide}`]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-2 border-[#444444] bg-white" title="Imposed Preview" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A0A0A0] dark:text-[#666666]">
                  <span className="material-symbols-outlined text-6xl mb-3 opacity-50">picture_as_pdf</span>
                  <p className="text-sm font-bold tracking-widest">PDF를 업로드하면 조판된 결과가 나타납니다.</p>
                </div>
              )}
            </div>

            <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-[#666666] dark:text-[#A0A0A0] font-bold">전지 크기: </span>
                  <span className="font-black text-[#222222] dark:text-[#EAEAEA]">{result ? `${result.name} (${result.yield}개 배치 가능)` : "-"}</span>
                </div>
              </div>
              <a 
                href={fullPdfUrl || "#"}
                download={getDownloadFileName()}
                className={`bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-6 py-2.5 font-black shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 ${(!fullPdfUrl || isGenerating) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <span className="material-symbols-outlined text-[18px]">download</span> 전체 인쇄용 PDF 다운로드
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}