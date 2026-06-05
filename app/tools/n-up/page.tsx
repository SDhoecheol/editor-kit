"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export default function NUpPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePages, setFilePages] = useState<number>(0);
  const [pdfW, setPdfW] = useState<number>(0);
  const [pdfH, setPdfH] = useState<number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const [paperW, setPaperW] = useState<number>(310);
  const [paperH, setPaperH] = useState<number>(225);
  const [sides, setSides] = useState<1 | 2>(2);
  const [cropMarks, setCropMarks] = useState<boolean>(true);

  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullPdfBytes, setFullPdfBytes] = useState<any>(null);

  // N-up calculation logic
  const { cols, rows, itemW, itemH, rotated90 } = useMemo(() => {
    if (!pdfW || !pdfH || !paperW || !paperH) return { cols: 0, rows: 0, itemW: 0, itemH: 0, rotated90: false };
    const opt1Cols = Math.floor(paperW / pdfW);
    const opt1Rows = Math.floor(paperH / pdfH);
    const opt1Total = opt1Cols * opt1Rows;

    const opt2Cols = Math.floor(paperW / pdfH);
    const opt2Rows = Math.floor(paperH / pdfW);
    const opt2Total = opt2Cols * opt2Rows;

    if (opt2Total > opt1Total) {
      return { cols: opt2Cols, rows: opt2Rows, itemW: pdfH, itemH: pdfW, rotated90: true };
    } else {
      return { cols: opt1Cols, rows: opt1Rows, itemW: pdfW, itemH: pdfH, rotated90: false };
    }
  }, [pdfW, pdfH, paperW, paperH]);

  const totalN = cols * rows;

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!fileBuffer || filePages === 0 || totalN === 0) {
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

        const drawSheet = async (doc: PDFDocument, isBack: boolean) => {
          const sheetW = paperW * MM_TO_PT; 
          const sheetH = paperH * MM_TO_PT;
          const slotW_pt = itemW * MM_TO_PT; 
          const slotH_pt = itemH * MM_TO_PT;
          
          const offsetX = (sheetW - (cols * slotW_pt)) / 2; 
          const offsetY = (sheetH - (rows * slotH_pt)) / 2;
          const page = doc.addPage([sheetW, sheetH]);

          const rawW_pt = pdfW * MM_TO_PT;
          const rawH_pt = pdfH * MM_TO_PT;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              // ⭐️ 머리 맞대기(Head-to-Head) 로직
              // 인접한 슬롯은 180도 회전시켜서 위아래/좌우가 맞닿게 처리
              // 양면(isBack)일 경우, 좌우 뒤집기(Turn)를 위해 c 위치를 역상으로 매핑
              const mappedC = isBack ? cols - 1 - c : c;
              
              const isRotated180 = ((mappedC + r) % 2 === 1);
              
              const x = offsetX + (c * slotW_pt); 
              const y = sheetH - offsetY - ((r + 1) * slotH_pt);
              
              // 페이지 결정 (간단히 첫 페이지만 사용, 양면이면 뒷면은 두 번째 페이지 사용)
              const pageNum = (isBack && srcPages.length >= 2) ? 1 : 0;
              const embeddedPage = await doc.embedPage(srcPages[pageNum]);
              
              let drawX = x;
              let drawY = y;
              let drawRot = 0;
              
              if (rotated90) {
                // PDF가 가로로 누워야 하는 경우 (90도 회전 베이스)
                if (isRotated180) {
                  // 원래 90도 + 180도 = 270도(-90도)
                  drawX = x;
                  drawY = y + slotH_pt;
                  drawRot = -90;
                } else {
                  // 90도 회전
                  drawX = x + slotW_pt;
                  drawY = y;
                  drawRot = 90;
                }
              } else {
                // 기본 세로형
                if (isRotated180) {
                  drawX = x + slotW_pt;
                  drawY = y + slotH_pt;
                  drawRot = 180;
                } else {
                  drawX = x;
                  drawY = y;
                  drawRot = 0;
                }
              }

              page.drawPage(embeddedPage, {
                x: drawX,
                y: drawY,
                width: rawW_pt,
                height: rawH_pt,
                rotate: degrees(drawRot)
              });
            }
          }

          // ⭐️ 재단선(돔보선) 그리기 (맞닿은 부분은 일자(-) 형태로)
          if (cropMarks) {
            const l = 5 * MM_TO_PT; 
            const str = 0.5;
            const gridLeft = offsetX; const gridRight = offsetX + (cols * slotW_pt);
            const gridBottom = sheetH - offsetY - (rows * slotH_pt); const gridTop = sheetH - offsetY;

            const drawL = (sx: number, sy: number, ex: number, ey: number) => page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: str, color: markColor });

            // 수직선 (상단/하단 틱)
            for(let c = 0; c <= cols; c++) {
              const cx = gridLeft + (c * slotW_pt);
              drawL(cx, gridTop, cx, gridTop + l);
              drawL(cx, gridBottom, cx, gridBottom - l);
            }
            // 수평선 (좌측/우측 틱)
            for(let r = 0; r <= rows; r++) {
              const cy = sheetH - offsetY - (r * slotH_pt);
              drawL(gridLeft, cy, gridLeft - l, cy);
              drawL(gridRight, cy, gridRight + l, cy);
            }
          }
        };

        const newPreviewUrls: Record<string, string> = {};
        
        const preFrontDoc = await PDFDocument.create();
        await drawSheet(preFrontDoc, false);
        const fBytes = await preFrontDoc.save();
        newPreviewUrls[`front`] = URL.createObjectURL(new Blob([fBytes as any], { type: 'application/pdf' }));

        if (sides === 2) {
          const preBackDoc = await PDFDocument.create();
          await drawSheet(preBackDoc, true);
          const bBytes = await preBackDoc.save();
          newPreviewUrls[`back`] = URL.createObjectURL(new Blob([bBytes as any], { type: 'application/pdf' }));
        }
        
        setPreviewUrls(prev => {
          Object.values(prev).forEach(u => URL.revokeObjectURL(u));
          return newPreviewUrls;
        });

        const fullDoc = await PDFDocument.create();
        await drawSheet(fullDoc, false);
        if (sides === 2) await drawSheet(fullDoc, true);
        setFullPdfBytes(await fullDoc.save());

      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }, 400); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileBuffer, paperW, paperH, sides, cropMarks, totalN]);

  const handleDownload = () => {
    if (!fullPdfBytes || !fileName) return;
    const blob = new Blob([fullPdfBytes as any], { type: 'application/pdf' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_두판걸이_${paperW}x${paperH}.pdf`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 03
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              디지털 인쇄 터잡기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            두판걸이 조판 (N-up)
          </h1>
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
                <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">예: A5 사이즈 등</p>
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
              <span className="material-symbols-outlined text-[18px]">tune</span> 조판 설정
            </div>
            <div className="p-5 space-y-5">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0]">인쇄 용지 규격 (mm)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={paperW} onChange={e => setPaperW(Number(e.target.value))} className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-2 text-sm font-bold outline-none focus:border-[#222222] dark:focus:border-[#EAEAEA]" />
                  <span className="text-[#666666] font-bold">X</span>
                  <input type="number" value={paperH} onChange={e => setPaperH(Number(e.target.value))} className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-2 text-sm font-bold outline-none focus:border-[#222222] dark:focus:border-[#EAEAEA]" />
                </div>
              </div>

              {pdfW > 0 && (
                <div className="bg-blue-50 dark:bg-[#1A233A] border-2 border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300">자동 계산 결과</p>
                  <p className="text-sm font-black text-blue-900 dark:text-blue-100 mt-1">
                    총 {totalN}개 안착 가능 ({cols} x {rows})
                  </p>
                  {totalN === 0 && <p className="text-xs text-red-600 mt-1">용지가 원고보다 작습니다.</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-0 border-2 border-[#222222] dark:border-[#444444]">
                <button onClick={() => { setSides(1); setPreviewSide("front"); }} className={`py-3 flex flex-col items-center justify-center transition-all border-r-2 border-[#222222] dark:border-[#444444] ${sides === 1 ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'bg-white dark:bg-[#1E1E1E] text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}>
                  <span className="font-bold text-sm">단면</span>
                </button>
                <button onClick={() => setSides(2)} className={`py-3 flex flex-col items-center justify-center transition-all ${sides === 2 ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' : 'bg-white dark:bg-[#1E1E1E] text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]'}`}>
                  <span className="font-bold text-sm">양면</span>
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

          <button 
            onClick={handleDownload} 
            disabled={!fullPdfBytes || isGenerating || totalN === 0} 
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span className="material-symbols-outlined text-[24px]">download</span> PDF 파일 저장
          </button>
        </div>

        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] flex flex-col h-[800px]">
          <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[#F5F4F0] font-black tracking-widest text-xs">PREVIEW</span>
              {sides === 2 && (
                <div className="flex border-2 border-[#F5F4F0] dark:border-[#444444]">
                  <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 text-xs font-bold transition-all border-r-2 border-[#F5F4F0] dark:border-[#444444] ${previewSide === 'front' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>앞면</button>
                  <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 text-xs font-bold transition-all ${previewSide === 'back' ? 'bg-[#F5F4F0] text-[#222222] dark:bg-[#444444] dark:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:bg-[#333333]'}`}>뒷면</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-5xl animate-spin mb-4">settings</span>
                <p className="text-white font-black tracking-widest text-lg drop-shadow-md">렌더링 중...</p>
              </div>
            )}
            
            {previewUrls[previewSide] ? (
              <div className="w-full h-full p-4 bg-[#121212]">
                <iframe src={`${previewUrls[previewSide]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-2 border-[#444444] bg-white" title="Imposed Preview" />
              </div>
            ) : (
              <div className="text-[#A0A0A0] dark:text-[#666666] text-center">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">description</span>
                <p className="font-bold text-sm tracking-widest">PDF 원고를 업로드하면 조판 결과가 나타납니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
