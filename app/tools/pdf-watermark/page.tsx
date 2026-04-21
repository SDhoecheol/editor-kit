"use client";

import { useState, useEffect, useRef } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export default function PdfWatermarkPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 워터마크 설정
  const [text, setText] = useState("CONFIDENTIAL");
  const [size, setSize] = useState(72);
  const [opacity, setOpacity] = useState(30); // 0-100
  const [angle, setAngle] = useState(45); // -180 to 180
  const [layout, setLayout] = useState<"center" | "tile">("center");
  const [color, setColor] = useState("#ff0000");

  const timerRef = useRef<NodeJS.Timeout>(null);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let file: File | null = null;
    if (e instanceof FileList) {
      file = e[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      setFileBuffer(buffer);
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null);
    setFileBuffer(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const applyWatermark = async (buffer: ArrayBuffer, previewOnly = false) => {
    const pdfDoc = await PDFDocument.load(buffer);
    
    // 기본 내장 폰트 사용 (영문/숫자 전용)
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // 미리보기 시에는 속도를 위해 첫 페이지만 처리
    const pages = previewOnly ? [pdfDoc.getPages()[0]] : pdfDoc.getPages();
    
    const safeText = text.trim() === "" ? " " : text;
    const textWidth = font.widthOfTextAtSize(safeText, size);
    const textHeight = font.heightAtSize(size);
    const { r, g, b } = hexToRgb(color);

    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      if (layout === "center") {
        // 화면 중앙에 배치하기 위해 텍스트 박스의 중심과 페이지 중심을 맞춤
        // pdf-lib의 원점은 좌측 하단입니다.
        const centerX = width / 2;
        const centerY = height / 2;
        
        page.drawText(safeText, {
          x: centerX,
          y: centerY,
          size,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(angle),
          // 텍스트의 중심을 앵커 포인트로 사용 (최신 방식이 아니라면 x, y를 보정해야 함)
        });
        
        // 텍스트의 (0,0)은 왼쪽 하단. 각도가 적용되면 회전 중심도 (x,y).
        // 따라서 정확히 가운데 정렬하려면 회전 전 텍스트의 절반만큼 x,y에서 빼주어야 합니다. (간단하게 구현)
        const adjustedX = centerX - (textWidth / 2) * Math.cos(angle * Math.PI / 180) + (textHeight / 2) * Math.sin(angle * Math.PI / 180);
        const adjustedY = centerY - (textWidth / 2) * Math.sin(angle * Math.PI / 180) - (textHeight / 2) * Math.cos(angle * Math.PI / 180);

      }
    });

    // 위에서 page.drawText의 위치 계산이 약간 복잡할 수 있으므로, 안전하게 재작성합니다.
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // pdf-lib에서 텍스트를 정가운데 위치시키고 중심을 축으로 회전시키기 위한 매트릭스 변환 꼼수 대신 직관적 위치 계산 적용.
      // (완벽한 중심축 회전을 위해 page.drawText보다 조금 더 큰 범위로 타일링하는 것이 사실 가장 쉽고 확실합니다.)
      
      if (layout === "center") {
        // 중앙 배치 시 앵커 보정 (정확한 중심점 회전 보정은 다소 복잡하므로 근사치 사용)
        const xOffset = textWidth / 2;
        const yOffset = textHeight / 4; 
        
        page.drawText(safeText, {
          x: width / 2 - xOffset,
          y: height / 2 - yOffset,
          size,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(angle),
        });
      } else {
        // 전체 반복(Tile) 레이아웃
        const stepX = textWidth + 50;
        const stepY = textHeight + 50;
        
        // 화면의 -1배부터 2배 크기까지 반복하여 회전 시 잘리는 부분 방지
        for (let x = -width; x < width * 2; x += stepX) {
          for (let y = -height; y < height * 2; y += stepY) {
            page.drawText(safeText, {
              x,
              y,
              size,
              font,
              color: rgb(r, g, b),
              opacity: opacity / 100,
              rotate: degrees(angle),
            });
          }
        }
      }
    });

    return await pdfDoc.save();
  };

  // 실시간 미리보기 (디바운스 적용)
  useEffect(() => {
    if (!fileBuffer) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setIsGeneratingPreview(true);

    timerRef.current = setTimeout(async () => {
      try {
        const pdfBytes = await applyWatermark(fileBuffer.slice(0), true);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fileBuffer, text, size, opacity, angle, layout, color]);

  const handleSave = async () => {
    if (!fileBuffer) return;
    setIsSaving(true);
    
    try {
      // 실제 저장 시에는 모든 페이지 적용
      const pdfBytes = await applyWatermark(fileBuffer.slice(0), false);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "document";
      a.download = `${today}_${baseName}_watermarked.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 flex flex-col h-screen">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 mb-8 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
            유틸리티 / 04
          </span>
          <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
            PDF 일괄 워터마크
          </span>
        </div>
        <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
          PDF 워터마크
        </h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* 왼쪽: 컨트롤 패널 */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
          {!fileName ? (
            <div 
              className={`bg-white dark:bg-[#1E1E1E] border-4 border-dashed border-[#222222] dark:border-[#444444] p-10 flex flex-col items-center justify-center relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] ${
                isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="file-upload" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <span className="material-symbols-outlined text-6xl mb-4 text-[#222222] dark:text-[#EAEAEA]">upload_file</span>
              <h3 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] mb-2 text-center">PDF 업로드</h3>
              <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] text-center">클릭하거나 드래그하여 파일을 첨부하세요</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-6 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#222222] dark:border-[#444444]">
                <div className="flex items-center gap-3 w-[70%]">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">picture_as_pdf</span>
                  <p className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-full">{fileName}</p>
                </div>
                <button 
                  onClick={removeFile}
                  className="text-xs font-bold text-[#A0A0A0] hover:text-red-500 transition-colors border border-[#E5E4E0] dark:border-[#444444] px-2 py-1"
                >
                  지우기
                </button>
              </div>

              {/* 워터마크 설정 폼 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">워터마크 텍스트</label>
                  <input 
                    type="text" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    placeholder="CONFIDENTIAL"
                    className="w-full border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] px-4 py-3 text-lg font-bold text-[#222222] dark:text-[#EAEAEA] outline-none focus:border-blue-500 uppercase"
                  />
                  <p className="text-[10px] text-[#A0A0A0] mt-1 font-mono">※ 영문, 숫자, 특수문자 전용 (한글 지원 안됨)</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">컬러</label>
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-12 border-2 border-[#222222] dark:border-[#444444] cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">투명도 ({opacity}%)</label>
                    <input 
                      type="range" 
                      min="5" max="100" 
                      value={opacity} 
                      onChange={(e) => setOpacity(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#E5E4E0] dark:bg-[#444444] appearance-none mt-4 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">폰트 크기 ({size}pt)</label>
                  <input 
                    type="range" 
                    min="12" max="200" 
                    value={size} 
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E5E4E0] dark:bg-[#444444] appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">회전 각도 ({angle}°)</label>
                  <input 
                    type="range" 
                    min="-90" max="90" 
                    value={angle} 
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E5E4E0] dark:bg-[#444444] appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-3">배치 형태</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 border-2 py-3 flex justify-center items-center gap-2 cursor-pointer transition-colors ${layout === 'center' ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' : 'border-[#222222] dark:border-[#444444] text-[#222222] dark:text-[#EAEAEA]'}`}>
                      <input type="radio" name="layout" checked={layout === 'center'} onChange={() => setLayout('center')} className="hidden" />
                      <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                      <span className="font-bold text-sm">중앙 배치</span>
                    </label>
                    <label className={`flex-1 border-2 py-3 flex justify-center items-center gap-2 cursor-pointer transition-colors ${layout === 'tile' ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' : 'border-[#222222] dark:border-[#444444] text-[#222222] dark:text-[#EAEAEA]'}`}>
                      <input type="radio" name="layout" checked={layout === 'tile'} onChange={() => setLayout('tile')} className="hidden" />
                      <span className="material-symbols-outlined text-[18px]">apps</span>
                      <span className="font-bold text-sm">전체 반복</span>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t-4 border-[#222222] dark:border-[#444444]">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-4 text-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <><span className="material-symbols-outlined animate-spin">autorenew</span> 처리 중...</>
                    ) : (
                      <><span className="material-symbols-outlined">download</span> 전체 페이지 저장</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 라이브 프리뷰 */}
        <div className="flex-1 bg-[#2A2A2A] border-4 border-[#222222] dark:border-[#444444] relative flex items-center justify-center overflow-hidden min-h-[500px]">
          {!fileName ? (
            <div className="text-[#666666] flex flex-col items-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">visibility_off</span>
              <p className="font-bold tracking-widest">미리보기 영역</p>
            </div>
          ) : (
            <>
              {previewUrl && (
                <div className="w-full h-full p-4 bg-[#121212]">
                  <iframe 
                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                    className="w-full h-full border-2 border-[#444444] shadow-2xl bg-white" 
                    title="PDF Preview" 
                  />
                </div>
              )}
              {isGeneratingPreview && (
                <div className="absolute inset-0 bg-[#222222]/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-white text-5xl animate-spin">autorenew</span>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
