"use client";

import { useState, useEffect, useRef } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export default function HarikomiPage() {
  // 메인 탭
  const [tab, setTab] = useState<"card" | "saddle">("card");

  // 공통 상태
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePages, setFilePages] = useState<number>(0);
  const [pdfW, setPdfW] = useState<number>(0);
  const [pdfH, setPdfH] = useState<number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  // 설정 상태
  const [sides, setSides] = useState<1 | 2>(2);
  const [cropMarks, setCropMarks] = useState<boolean>(true);
  const [layoutOption, setLayoutOption] = useState<"standard" | "2up" | "5up" | "10up">("standard");

  // 뷰어 및 생성 상태
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullPdfBytes, setFullPdfBytes] = useState<any>(null);

  // 총 시트 계산
  const totalDesigns = sides === 2 ? Math.floor(filePages / 2) : filePages;
  let totalSheets = 1;
  if (tab === "card" && totalDesigns > 0) {
    if (layoutOption === "standard") totalSheets = totalDesigns;
    if (layoutOption === "2up") totalSheets = Math.ceil(totalDesigns / 2);
    if (layoutOption === "5up") totalSheets = Math.ceil(totalDesigns / 5);
    if (layoutOption === "10up") totalSheets = Math.ceil(totalDesigns / 10);
  } else if (tab === "saddle" && filePages > 0) {
    const paddedPages = Math.ceil(filePages / 4) * 4;
    totalSheets = paddedPages / 4;
  }

  // 파일 업로드
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
        alert("PDF 오류");
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

  // 슬롯 매핑 로직
  const getCardDesignForSlot = (sheet: number, slot: number, isBack: boolean) => {
    if (totalDesigns === 0) return null;
    const mappedSlot = isBack ? (slot < 5 ? slot + 5 : slot - 5) : slot;
    let designIdx = 0;
    if (layoutOption === "standard") designIdx = sheet;
    else if (layoutOption === "2up") designIdx = sheet * 2 + (mappedSlot < 5 ? 0 : 1);
    else if (layoutOption === "5up") designIdx = sheet * 5 + Math.floor(mappedSlot / 2);
    else if (layoutOption === "10up") designIdx = sheet * 10 + mappedSlot;

    if (designIdx >= totalDesigns) return null;
    const pageNum = designIdx * sides + (isBack && sides === 2 ? 1 : 0) + 1;
    return { designIdx, pageNum };
  };

  const getSaddlePageForSlot = (sheet: number, slot: number, isBack: boolean) => {
    const paddedPages = Math.ceil(filePages / 4) * 4;
    if (!isBack) return slot === 0 ? paddedPages - (2 * sheet) : (2 * sheet) + 1;
    else return slot === 0 ? (2 * sheet) + 2 : paddedPages - 1 - (2 * sheet);
  };

  // 실시간 PDF 렌더링 엔진
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
            // 🔥 중철 제본 렌더링 (안전 여백 추가!)
            const itemW = pdfW * MM_TO_PT; 
            const itemH = pdfH * MM_TO_PT;
            const margin_pt = 15 * MM_TO_PT; // 15mm 안전 여백 (재단선이 보일 공간)
            
            const sheetW = (itemW * 2) + (margin_pt * 2); 
            const sheetH = itemH + (margin_pt * 2);
            
            const page = doc.addPage([sheetW, sheetH]);
            
            for (let c = 0; c < 2; c++) {
              const pageNum = getSaddlePageForSlot(sheetIdx, c, isBack);
              if (pageNum <= srcPages.length) {
                const embeddedPage = await doc.embedPage(srcPages[pageNum - 1]);
                page.drawPage(embeddedPage, { 
                  x: margin_pt + (c * itemW), 
                  y: margin_pt, 
                  width: itemW, 
                  height: itemH 
                });
              }
            }

            // 🔥 중철 제본용 재단선 (안전 여백을 고려한 정확한 위치)
            if (cropMarks) {
              const b_pt = 3 * MM_TO_PT; // 기본 도련 3mm (사용자 PDF에 포함되었다고 가정)
              const l = 5 * MM_TO_PT;    // 십자 마크 선 길이 5mm
              const str = 0.5;

              const left = margin_pt;
              const right = margin_pt + itemW * 2;
              const top = margin_pt + itemH;
              const bottom = margin_pt;
              const center = margin_pt + itemW;

              const drawL = (sx: number, sy: number, ex: number, ey: number) => page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: str, color: markColor });

              // 좌측 상단
              drawL(left + b_pt, top, left + b_pt, top + l);
              drawL(left, top - b_pt, left - l, top - b_pt);
              // 우측 상단
              drawL(right - b_pt, top, right - b_pt, top + l);
              drawL(right, top - b_pt, right + l, top - b_pt);
              // 좌측 하단
              drawL(left + b_pt, bottom, left + b_pt, bottom - l);
              drawL(left, bottom + b_pt, left - l, bottom + b_pt);
              // 우측 하단
              drawL(right - b_pt, bottom, right - b_pt, bottom - l);
              drawL(right, bottom + b_pt, right + l, bottom + b_pt);
              
              // 중앙 제본선(접지선) 상하단 마크
              drawL(center, top, center, top + l);
              drawL(center, bottom, center, bottom - l);
            }
          }
        };

        const newPreviewUrls: Record<string, string> = {};
        for (let s = 0; s < totalSheets; s++) {
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
        for (let s = 0; s < totalSheets; s++) {
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
  }, [fileBuffer, tab, layoutOption, sides, cropMarks, totalSheets, filePages, pdfW, pdfH]);

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
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* 상단 탭 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-sm border border-slate-200 flex">
            <button onClick={() => { setTab("card"); setFilePages(0); setFileName(null); setFileBuffer(null); }} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${tab === 'card' ? 'bg-blue-50 text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
              명함 하리꼬미
            </button>
            <button onClick={() => { setTab("saddle"); setFilePages(0); setFileName(null); setFileBuffer(null); }} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${tab === 'saddle' ? 'bg-blue-50 text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              중철 하리꼬미
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            
            {/* 파일 업로드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-dashed border-2 hover:border-blue-400 transition-colors relative">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!fileName ? (
                <div className="text-center pointer-events-none">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">PDF 파일 업로드</p>
                  <p className="text-xs text-slate-400 mt-1">클릭하거나 드래그하여 첨부</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 z-20 relative">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{filePages}p | {pdfW}x{pdfH}mm</p>
                  </div>
                  <button onClick={removeFile} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              )}
            </div>

            {/* 설정 옵션 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 font-bold text-slate-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                {tab === 'card' ? '명함 설정' : '중철 설정'}
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setSides(1); setPreviewSide("front"); }} className={`py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${sides === 1 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}>
                    <span className="font-bold text-sm">단면</span>
                    {/* 🔥 텍스트 단위 교체 (명함일 땐 1명, 중철일 땐 인쇄면) */}
                    <span className="text-[10px] opacity-70 mt-1">{tab === 'card' ? '1페이지 1명' : '단면 인쇄'}</span>
                  </button>
                  <button onClick={() => setSides(2)} className={`py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${sides === 2 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}>
                    <span className="font-bold text-sm">양면</span>
                    {/* 🔥 텍스트 단위 교체 */}
                    <span className="text-[10px] opacity-70 mt-1">{tab === 'card' ? '2페이지 1명' : '양면 인쇄'}</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between border border-slate-200 rounded-xl p-4">
                  <div>
                    <p className="font-bold text-sm text-slate-800 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg> 재단선 표시</p>
                    <p className="text-[11px] text-slate-500 mt-1">작업물 외곽 모서리에 십자 마크</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={cropMarks} onChange={(e) => setCropMarks(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 명함일 경우 배치 옵션 */}
            {tab === "card" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-slate-600 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> 배치 옵션
                  </div>
                  <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">총 {totalDesigns}건</span>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { id: "standard", title: "개별 (Standard)", desc: "1건 전체 채움 (독판)" },
                    { id: "2up", title: "반반 (2-Up)", desc: "한 장에 2건 반반 (5장/5장)" },
                    { id: "5up", title: "5종 합장 (5-Up)", desc: "한 장에 5건 (2장씩)", badge: "추천" },
                    { id: "10up", title: "10종 합장 (10-Up)", desc: "한 장에 10건 (1장씩)", badge: "추천" }
                  ].map((opt) => (
                    <button key={opt.id} onClick={() => { setLayoutOption(opt.id as any); setCurrentSheet(0); }} className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${layoutOption === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                      <div>
                        <p className={`font-bold text-sm ${layoutOption === opt.id ? 'text-blue-800' : 'text-slate-800'} flex items-center gap-2`}>
                          {opt.title} {opt.badge && <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded">{opt.badge}</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 다운로드 버튼 */}
            <button onClick={handleDownload} disabled={!fullPdfBytes || isGenerating} className="w-full bg-[#1e293b] hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              전체 인쇄용 PDF 저장
            </button>
          </div>

          {/* 우측 패널: 진짜 PDF 실시간 뷰어 */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[800px]">
            
            {/* 다크 헤더 */}
            <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-bold tracking-widest text-xs">PREVIEW</span>
                {(sides === 2 || tab === "saddle") && (
                  <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${previewSide === 'front' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>앞면</button>
                    <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${previewSide === 'back' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>뒷면</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentSheet(Math.max(0, currentSheet - 1))} disabled={currentSheet === 0} className="text-slate-400 hover:text-white disabled:opacity-30 flex items-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <span className="text-sm font-bold text-white w-24 text-center">Sheet {currentSheet + 1} / {totalSheets}</span>
                <button onClick={() => setCurrentSheet(Math.min(totalSheets - 1, currentSheet + 1))} disabled={currentSheet === totalSheets - 1} className="text-slate-400 hover:text-white disabled:opacity-30 flex items-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>

            {/* 실시간 뷰어 영역 */}
            <div className="flex-1 bg-[#0f172a] relative flex items-center justify-center overflow-hidden">
              {isGenerating && (
                <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <svg className="w-10 h-10 text-white animate-spin mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  <p className="text-white font-bold text-lg drop-shadow-md">실시간 렌더링 중...</p>
                </div>
              )}
              
              {/* 이미 만들어둔 PDF 0초 만에 띄우기 */}
              {previewUrls[`${currentSheet}-${previewSide}`] ? (
                <div className="w-full h-full p-4 bg-slate-800">
                  <iframe src={`${previewUrls[`${currentSheet}-${previewSide}`]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-0 shadow-2xl rounded" title="Imposed Preview" />
                </div>
              ) : (
                <div className="text-slate-500 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="font-bold text-sm">PDF를 업로드하면 조판 결과가 나타납니다.</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-center items-center shrink-0">
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                배열을 확인하신 후 좌측 하단의 '인쇄용 PDF 저장' 버튼을 눌러주세요.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}