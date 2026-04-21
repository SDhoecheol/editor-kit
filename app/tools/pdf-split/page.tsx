"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

function parseRange(rangeStr: string, maxPage: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1) {
        for (let i = start; i <= Math.min(end, maxPage); i++) {
          pages.add(i - 1); // 0-indexed for pdf-lib
        }
      }
    } else {
      const page = parseInt(part);
      if (!isNaN(page) && page >= 1 && page <= maxPage) {
        pages.add(page - 1);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export default function PdfSplitPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const [mode, setMode] = useState<"all" | "range">("all");
  const [rangeInput, setRangeInput] = useState<string>("1-5, 8");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
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
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const pdfDoc = await PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPageCount();
        
        setFileBuffer(buffer);
        setTotalPages(pageCount);
      } catch (err) {
        alert("PDF 로드 오류가 발생했습니다. 암호가 걸려있거나 손상된 파일일 수 있습니다.");
        removeFile();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null);
    setFileBuffer(null);
    setTotalPages(0);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

  const handleExtract = async () => {
    if (!fileBuffer) return;
    setIsExtracting(true);

    try {
      const srcPdf = await PDFDocument.load(fileBuffer);
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "document";

      if (mode === "all") {
        // 모든 페이지 개별 추출 -> ZIP
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          zip.file(`${baseName}_P${i + 1}.pdf`, pdfBytes);
        }
        
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipContent);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${today}_${baseName}_개별분할.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // 특정 범위 추출 -> 한 개의 PDF로 병합
        const targetPages = parseRange(rangeInput, totalPages);
        if (targetPages.length === 0) {
          alert("유효한 페이지 범위가 아닙니다.");
          setIsExtracting(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(srcPdf, targetPages);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${today}_${baseName}_${targetPages.length}p_추출.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert("추출 중 오류가 발생했습니다.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 02
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              PDF 간편 분할기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 분할
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 왼쪽: 파일 업로드 */}
        <div className="space-y-6">
          <div 
            className={`bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-[#222222] dark:border-[#444444] p-8 h-64 flex flex-col items-center justify-center relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors ${
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
            {!fileName ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-5xl mb-3 text-[#222222] dark:text-[#EAEAEA]">upload_file</span>
                <p className="text-lg font-black text-[#222222] dark:text-[#EAEAEA]">PDF 원고 업로드</p>
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mt-2">클릭하거나 드래그하여 첨부</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-20 relative w-full px-4">
                <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400 mb-3">picture_as_pdf</span>
                <p className="text-base font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-full">{fileName}</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-3 py-1 font-mono font-bold text-sm">
                  총 {totalPages} 페이지
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); removeFile(); }} 
                  className="mt-6 text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] px-4 py-1 text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">close</span> 파일 지우기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 분할 옵션 및 다운로드 */}
        <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-6 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">settings</span> 추출 옵션 선택
            </h3>
            
            <div className="space-y-4">
              {/* 옵션 1: 모든 페이지 개별 추출 */}
              <label 
                className={`flex items-start gap-3 p-4 border-2 transition-all cursor-pointer ${
                  mode === 'all' 
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' 
                    : 'border-[#E5E4E0] dark:border-[#444444] hover:border-[#222222] dark:hover:border-[#A0A0A0]'
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'all' ? 'border-blue-600 dark:border-blue-500' : 'border-[#A0A0A0]'}`}>
                  {mode === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />}
                </div>
                <div>
                  <p className={`font-bold text-sm ${mode === 'all' ? 'text-blue-800 dark:text-blue-300' : 'text-[#222222] dark:text-[#EAEAEA]'}`}>
                    모든 페이지 개별 추출
                  </p>
                  <p className="text-xs mt-1 text-[#666666] dark:text-[#A0A0A0] leading-relaxed">
                    전체 페이지를 각각 1장짜리 PDF로 쪼개어 ZIP 파일로 한 번에 다운로드합니다.
                  </p>
                </div>
                <input 
                  type="radio" 
                  name="mode" 
                  checked={mode === 'all'} 
                  onChange={() => setMode('all')} 
                  className="hidden" 
                />
              </label>

              {/* 옵션 2: 특정 범위 추출 */}
              <label 
                className={`flex items-start gap-3 p-4 border-2 transition-all cursor-pointer ${
                  mode === 'range' 
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' 
                    : 'border-[#E5E4E0] dark:border-[#444444] hover:border-[#222222] dark:hover:border-[#A0A0A0]'
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'range' ? 'border-blue-600 dark:border-blue-500' : 'border-[#A0A0A0]'}`}>
                  {mode === 'range' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />}
                </div>
                <div className="w-full">
                  <p className={`font-bold text-sm ${mode === 'range' ? 'text-blue-800 dark:text-blue-300' : 'text-[#222222] dark:text-[#EAEAEA]'}`}>
                    특정 범위 및 페이지 지정 추출
                  </p>
                  <p className="text-xs mt-1 mb-3 text-[#666666] dark:text-[#A0A0A0] leading-relaxed">
                    지정한 페이지만 모아서 1개의 새로운 PDF로 추출합니다.
                  </p>
                  
                  {mode === 'range' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder="예: 1-5, 8, 10-12"
                        className="w-full border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] px-3 py-2 text-sm font-bold text-[#222222] dark:text-[#EAEAEA] outline-none focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className="text-[10px] text-[#A0A0A0] mt-1 font-mono">예시: 1-3, 5, 7-10</p>
                    </div>
                  )}
                </div>
                <input 
                  type="radio" 
                  name="mode" 
                  checked={mode === 'range'} 
                  onChange={() => setMode('range')} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleExtract}
              disabled={!fileBuffer || isExtracting || totalPages === 0}
              className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isExtracting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">autorenew</span> 처리 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">download</span> 추출 및 다운로드
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
