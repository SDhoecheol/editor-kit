"use client";

import { useState, useEffect, useRef } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const paperSizes: Record<string, { name: string; w: number; h: number }> = {
  guk: { name: '국전지', w: 939, h: 636 },
  '4x6': { name: '4x6전지', w: 1091, h: 788 },
  guk_half: { name: '국반전지', w: 636, h: 469 },
  '4x6_half': { name: '4x6반전지', w: 788, h: 545 }
};

// 16P 무선/양장 접지 하리꼬미 배열
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
  const [qty, setQty] = useState<number>(1000);
  const [paperPref, setPaperPref] = useState<string>("auto");
  
  const [impositionMode, setImpositionMode] = useState<"repeat" | "signature16">("repeat");
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  
  // 뷰어 컨트롤 상태
  const [fullPdfUrl, setFullPdfUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentSheetIdx, setCurrentSheetIdx] = useState<number>(0);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [totalSheets, setTotalSheets] = useState<number>(1);

  // 파일 업로드 처리
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

  // 연수/절수 계산 엔진
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

  // 1대(시트)를 그리는 핵심 로직
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

  // 사전 렌더링 (Pre-render)
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

  // 🌟 실무용 파일명 생성 로직
  const getDownloadFileName = () => {
    if (!fileName) return "imposed.pdf";
    const baseName = fileName.replace(/\.[^/.]+$/, ""); // 확장자 제거
    const modeStr = impositionMode === "signature16" ? "16P접지" : "낱장반복";
    const sideStr = sides === 2 ? "양면" : "단면";
    return `${baseName}_하리꼬미_${modeStr}_${sideStr}.pdf`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      
      <h1 className="text-3xl font-bold text-slate-800 mb-8">절수 및 조판(하리꼬미) 계산기</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 왼쪽 설정 패널 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">upload_file</span> 원본 PDF 업로드
            </h3>
            <div className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-500 transition-all mb-4 overflow-hidden">
              <input accept=".pdf" id="yc-file-input" type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!fileName ? (
                <div className="text-center px-4 pointer-events-none">
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">picture_as_pdf</span>
                  <p className="text-xs font-bold text-slate-600">PDF 파일을 드래그하세요</p>
                </div>
              ) : (
                <div className="w-full px-4 text-center z-20">
                  <p className="text-sm font-bold text-blue-600 truncate">{fileName}</p>
                  <button onClick={resetFile} className="mt-2 text-[11px] text-slate-400 hover:text-red-500 font-medium transition-colors bg-white px-3 py-1 rounded-full border border-slate-200">초기화</button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">가로 (mm)</label>
                <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">세로 (mm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">grid_view</span> 조판 방식
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => setImpositionMode("repeat")} className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${impositionMode === 'repeat' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'}`}>
                낱장 반복 (전단)
              </button>
              <button onClick={() => setImpositionMode("signature16")} className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${impositionMode === 'signature16' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'}`}>
                16P 책자 접지
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">총 페이지 수 (p)</label>
                  <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" min="1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">인쇄면</label>
                  <select value={sides} onChange={(e) => { setSides(Number(e.target.value)); setPreviewSide("front"); }} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold">
                    <option value={1}>단면 (1면)</option>
                    <option value={2}>양면 (2면)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">여백/도련 (mm)</label>
                  <input type="number" value={bleed} onChange={(e) => setBleed(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">사용 전지 선택</label>
                  <select value={paperPref} onChange={(e) => setPaperPref(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold">
                    <option value="auto">자동 추천</option>
                    <option value="guk">국전지</option>
                    <option value="4x6">4x6전지</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 뷰어 패널 */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest block mb-1">추천 전지 및 절수</span>
              <h4 className="text-white font-black text-2xl">{result ? result.name : "-"}</h4>
              <p className="text-slate-400 text-sm mt-1">{result ? `1장당 ${result.yield}개 안착 (${result.yield}절)` : "-"}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">정매수 (로스 제외)</span>
              <div className="flex items-baseline gap-1">
                <h4 className="text-slate-900 font-black text-3xl">{result ? result.actualReams.toFixed(3) : "0"}</h4>
                <span className="text-slate-500 font-bold text-sm">연</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 flex flex-col justify-center">
              <span className="text-blue-500 text-[10px] font-bold uppercase tracking-widest block mb-1">발주 수량 (여분 포함)</span>
              <div className="flex items-baseline gap-1">
                <h4 className="text-blue-700 font-black text-3xl">{result ? result.neededReams.toFixed(3) : "0"}</h4>
                <span className="text-blue-600 font-bold text-sm">연</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[700px] flex flex-col relative overflow-hidden">
            
            <div className="bg-[#1e293b] px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">visibility</span> 조판 미리보기
                </span>
                
                {sides === 2 && (
                  <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${previewSide === 'front' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>앞면</button>
                    <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${previewSide === 'back' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>뒷면</button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer mr-4">
                  <input type="checkbox" checked={includeCropMarks} onChange={(e) => setIncludeCropMarks(e.target.checked)} className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-0 bg-slate-700 border-slate-600" />
                  재단선 긋기
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentSheetIdx(Math.max(0, currentSheetIdx - 1))} disabled={currentSheetIdx === 0} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="text-sm font-bold text-white w-20 text-center">{currentSheetIdx + 1} / {totalSheets} 대</span>
                  <button onClick={() => setCurrentSheetIdx(Math.min(totalSheets - 1, currentSheetIdx + 1))} disabled={currentSheetIdx === totalSheets - 1} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-300 relative">
              {/* 🌟 렌더링 텍스트 간소화! */}
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <span className="material-symbols-outlined text-5xl text-white animate-spin mb-4">settings_suggest</span>
                  <p className="text-white font-bold text-lg drop-shadow-md">렌더링 중...</p>
                </div>
              )}
              
              {previewUrls[`${currentSheetIdx}-${previewSide}`] ? (
                <iframe src={`${previewUrls[`${currentSheetIdx}-${previewSide}`]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-0" title="Imposed Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                  <span className="material-symbols-outlined text-6xl mb-3 opacity-30">picture_as_pdf</span>
                  <p className="text-sm font-medium opacity-50">PDF를 업로드하면 조판된 결과가 나타납니다.</p>
                </div>
              )}
            </div>

            <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-slate-400 font-medium">전지: </span>
                  <span className="font-bold text-slate-800">{result ? `${result.name} (${result.yield}절)` : "-"}</span>
                </div>
              </div>
              {/* 🌟 동적 파일명 적용! */}
              <a 
                href={fullPdfUrl || "#"}
                download={getDownloadFileName()}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${(!fullPdfUrl || isGenerating) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">download</span> 전체 인쇄용 PDF 저장
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}