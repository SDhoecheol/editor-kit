"use client";

import { useState, useRef, useEffect } from "react";
import { parsePdfDimensions, generateNestedPdf, MarkOption } from "./PdfProcessor";
import { packItems, PackItem, PlacedItem } from "./NestingEngine";

interface UploadedFile {
  id: string;
  fileId: string;
  name: string;
  buffer: ArrayBuffer;
  pageIndex: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export default function RollNesterPage() {
  const [maxRollWidth, setMaxRollWidth] = useState<number>(600); // 기본 600mm
  const [gutter, setGutter] = useState<number>(5); // 기본 5mm 여백
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [totalWidth, setTotalWidth] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);
  
  const [markOption, setMarkOption] = useState<MarkOption>("none");
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 알고리즘 실행: 파일 리스트, 용지폭, 여백이 변경될 때마다 자동 재조판
  useEffect(() => {
    if (files.length === 0) {
      setPlacedItems([]);
      setTotalWidth(0);
      setTotalHeight(0);
      return;
    }

    const itemsToPack: PackItem[] = [];
    files.forEach((file) => {
      for (let i = 0; i < file.quantity; i++) {
        itemsToPack.push({
          id: `${file.id}-${i}`,
          fileId: file.fileId,
          pageIndex: file.pageIndex,
          width: file.widthMm,
          height: file.heightMm,
        });
      }
    });

    // 마크 옵션에 따른 캔버스 외곽 여백(좌우 15mm씩 총 30mm)을 제외한 '실제 조판 가능 폭' 계산
    const marginMm = markOption === 'none' ? 0 : 15;
    const effectiveMaxWidth = Math.max(1, maxRollWidth - (marginMm * 2));

    const result = packItems(itemsToPack, effectiveMaxWidth, gutter);
    setPlacedItems(result.placedItems);
    setTotalWidth(result.totalWidth);
    setTotalHeight(result.totalHeight);
  }, [files, maxRollWidth, gutter, markOption]);

  // 미리보기 PDF 생성 (하리꼬미와 동일한 디바운스 패턴 적용)
  useEffect(() => {
    if (placedItems.length === 0) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setIsGenerating(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const fileBuffers: Record<string, ArrayBuffer> = {};
        files.forEach(f => fileBuffers[f.fileId] = f.buffer);

        const pdfBytes = await generateNestedPdf(placedItems, fileBuffers, totalWidth, totalHeight, markOption);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        console.error("Preview generation error:", e);
      } finally {
        setIsGenerating(false);
      }
    }, 400);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedItems, totalWidth, totalHeight, markOption]);

  // PDF 업로드 및 파싱
  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== "application/pdf") {
        alert(`${file.name}은(는) PDF 파일이 아닙니다.`);
        continue;
      }

      const buffer = await file.arrayBuffer();
      
      try {
        // 1. 치수 파싱 (다중 페이지 지원)
        const pagesDimensions = await parsePdfDimensions(buffer);
        const physicalFileId = Math.random().toString(36).substring(7);
        
        pagesDimensions.forEach((dim, index) => {
          newFiles.push({
            id: Math.random().toString(36).substring(7),
            fileId: physicalFileId,
            name: pagesDimensions.length > 1 ? `${file.name} (P.${index + 1})` : file.name,
            buffer,
            pageIndex: index,
            widthMm: Number(dim.widthMm.toFixed(1)),
            heightMm: Number(dim.heightMm.toFixed(1)),
            quantity: 1,
          });
        });
      } catch (err) {
        console.error("PDF Parse Error:", err);
        alert(`${file.name} 파싱 중 오류가 발생했습니다.`);
      }
    }
    
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  // PDF 출력 내보내기
  const handleExport = async () => {
    if (placedItems.length === 0) return alert("조판할 스티커가 없습니다.");
    setIsExporting(true);
    try {
      const fileBuffers: Record<string, ArrayBuffer> = {};
      files.forEach(f => fileBuffers[f.fileId] = f.buffer);

      const pdfBytes = await generateNestedPdf(placedItems, fileBuffers, totalWidth, totalHeight, markOption);
      
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const totalQty = files.reduce((acc, f) => acc + f.quantity, 0);
      a.href = url;
      a.download = `${today}_${files.length}종_${totalQty}개_실사출력.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#121212] flex flex-col md:flex-row transition-colors">
      
      {/* 왼쪽: 컨트롤 패널 */}
      <aside className="w-full md:w-96 bg-white dark:bg-[#1E1E1E] border-r-4 border-[#222222] dark:border-[#444444] flex flex-col h-screen shrink-0 overflow-y-auto">
        <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333]">
          <h1 className="text-2xl font-black uppercase text-[#222222] dark:text-[#EAEAEA] tracking-tighter">Roll Nester</h1>
          <p className="text-[#A0A0A0] text-sm font-bold mt-1">실사출력 자동조판기</p>
        </div>

        {/* 1. 용지 및 환경 설정 */}
        <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333] space-y-4">
          <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">1. ENVIRONMENT SETUP</h2>
          <div>
            <label className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] block mb-2">최대 가로폭 (Max Roll Width)</label>
            <div className="flex items-center">
              <input 
                type="number" 
                value={maxRollWidth} 
                onChange={(e) => setMaxRollWidth(Number(e.target.value))}
                className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent text-[#222222] dark:text-[#EAEAEA] p-2 font-mono text-lg outline-none focus:border-blue-500"
              />
              <span className="ml-2 font-bold text-[#A0A0A0]">mm</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] block mb-2">여백 간격 (Gutter)</label>
            <div className="flex items-center">
              <input 
                type="number" 
                value={gutter} 
                onChange={(e) => setGutter(Number(e.target.value))}
                className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent text-[#222222] dark:text-[#EAEAEA] p-2 font-mono text-lg outline-none focus:border-blue-500"
              />
              <span className="ml-2 font-bold text-[#A0A0A0]">mm</span>
            </div>
          </div>
        </div>

        {/* 2. 항목 컨트롤러 */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">2. ITEM CONTROLLER</h2>
            <label className="bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] px-3 py-1 text-xs font-bold cursor-pointer hover:opacity-80">
              + PDF 추가
              <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
            </label>
          </div>

          <div 
            className={`flex-1 overflow-y-auto border-2 border-dashed p-4 transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-[#A0A0A0] dark:border-[#444444]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A0A0A0]">
                <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
                <p className="text-sm font-bold text-center">PDF 파일을 이곳에<br/>드롭하세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map(file => (
                  <div key={file.id} className="bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] p-3 flex flex-col shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111]">
                    <div className="flex justify-between items-center border-b border-[#E5E4E0] dark:border-[#333333] pb-2 mb-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                        <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-40" title={file.name}>{file.name}</p>
                      </div>
                      <button onClick={() => removeFile(file.id)} className="text-[#A0A0A0] hover:text-red-500 material-symbols-outlined text-sm">close</button>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex gap-3 text-[10px]">
                        <div className="flex items-center">
                          <span className="text-[#A0A0A0] mr-1 font-bold">W:</span>
                          <input type="number" value={file.widthMm} onChange={(e) => updateFile(file.id, { widthMm: Number(e.target.value) })} className="w-12 border-b border-[#A0A0A0] bg-transparent outline-none text-[#222222] dark:text-[#EAEAEA] font-mono" />
                        </div>
                        <div className="flex items-center">
                          <span className="text-[#A0A0A0] mr-1 font-bold">H:</span>
                          <input type="number" value={file.heightMm} onChange={(e) => updateFile(file.id, { heightMm: Number(e.target.value) })} className="w-12 border-b border-[#A0A0A0] bg-transparent outline-none text-[#222222] dark:text-[#EAEAEA] font-mono" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#666666]">수량:</span>
                        <input type="number" min="1" value={file.quantity} onChange={(e) => updateFile(file.id, { quantity: parseInt(e.target.value) || 1 })} className="w-12 border-2 border-[#222222] dark:border-[#444444] bg-transparent text-center text-xs outline-none text-[#222222] dark:text-[#EAEAEA] font-bold"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. 출력 옵션 */}
        <div className="p-6 border-t-4 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1A1A1A]">
          <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-3">3. TRIM & EXPORT</h2>
          <select 
            value={markOption} 
            onChange={(e) => setMarkOption(e.target.value as MarkOption)}
            className="w-full border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] p-2 text-sm font-bold outline-none mb-4"
          >
            <option value="none">재단선 없음</option>
            <option value="corner">L자 코너 재단선 (Trim Marks)</option>
            <option value="crosshair">십자 돔보 마크 (Registration)</option>
          </select>

          <button 
            onClick={handleExport}
            disabled={isExporting || files.length === 0}
            className="w-full bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] font-black py-4 uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? "GENERATING PDF..." : "EXPORT NESTED PDF"}
          </button>
        </div>
      </aside>

      {/* 오른쪽: 메인 캔버스 미리보기 */}
      <main className="flex-1 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] m-6 flex flex-col shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] overflow-hidden">
        <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
          <span className="text-[#F5F4F0] font-black tracking-widest text-xs">PREVIEW</span>
        </div>

        <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
          {isGenerating && (
            <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <span className="material-symbols-outlined text-white text-5xl animate-spin mb-4">settings</span>
              <p className="text-white font-black tracking-widest text-lg drop-shadow-md">렌더링 중...</p>
            </div>
          )}
          
          {previewUrl ? (
            <div className="w-full h-full p-4 bg-[#121212]">
              <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-2 border-[#444444] bg-white" title="Nested Preview" />
            </div>
          ) : (
            <div className="text-[#A0A0A0] dark:text-[#666666] text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">wallpaper</span>
              <p className="font-bold text-sm tracking-widest">PDF 원고를 업로드하면 자동 조판 결과가 나타납니다.</p>
            </div>
          )}
        </div>
        
        <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] p-4 flex justify-center items-center shrink-0">
          <p className="text-[#666666] dark:text-[#A0A0A0] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            배열을 확인하신 후 좌측 패널의 'EXPORT NESTED PDF' 버튼을 눌러 저장하세요.
          </p>
        </div>
      </main>

    </div>
  );
}
