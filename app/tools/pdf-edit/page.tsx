"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PageEdit {
  id: string;
  pageIndex: number;
  rotation: number;
  thumbnailUrl: string;
}

export default function PdfEditPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageEdit[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let file: File | null = null;
    if (e instanceof FileList) {
      file = e[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');

    setIsLoading(true);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        setFileBuffer(buffer);

        // pdfjs-dist 워커 에러 방지를 위해 원본 버퍼 복사본 전달
        const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const total = pdf.numPages;
        
        const newPages: PageEdit[] = [];
        
        // 병렬로 렌더링하면 브라우저가 멈출 수 있으므로 순차적으로 렌더링
        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 }); // 썸네일 해상도 최적화
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            newPages.push({
              id: Math.random().toString(36).substring(7),
              pageIndex: i - 1, // pdf-lib은 0부터 시작
              rotation: 0,
              thumbnailUrl: canvas.toDataURL("image/jpeg", 0.7),
            });
          }
        }
        setPages(newPages);
      } catch (err) {
        console.error(err);
        alert("PDF 렌더링 중 오류가 발생했습니다. 암호가 걸려있거나 손상된 파일일 수 있습니다.");
        removeFile();
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null);
    setFileBuffer(null);
    setPages([]);
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

  // 개별 페이지 회전
  const rotatePage = (id: string) => {
    setPages(pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  // 개별 페이지 삭제
  const deletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
  };

  // 페이지 순서 드래그 앤 드롭
  const onDragStartItem = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const onDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newPages = [...pages];
    const draggedItem = newPages[draggedIdx];
    newPages.splice(draggedIdx, 1);
    newPages.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setPages(newPages);
  };

  const onDragEndItem = () => {
    setDraggedIdx(null);
  };

  const handleSave = async () => {
    if (!fileBuffer || pages.length === 0) return alert("저장할 페이지가 없습니다.");
    setIsSaving(true);

    try {
      const srcPdf = await PDFDocument.load(fileBuffer);
      const newPdf = await PDFDocument.create();

      for (const p of pages) {
        const [copiedPage] = await newPdf.copyPages(srcPdf, [p.pageIndex]);
        
        // 기존 회전값에 사용자가 추가한 회전값을 더합니다.
        if (p.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRot + p.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "document";
      a.download = `${today}_${baseName}_편집됨.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
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
              PDF 페이지 편집기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 편집
          </h1>
        </div>
      </header>

      {!fileName ? (
        <div 
          className={`bg-white dark:bg-[#1E1E1E] border-4 border-dashed border-[#222222] dark:border-[#444444] p-16 flex flex-col items-center justify-center relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] ${
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
          <span className="material-symbols-outlined text-6xl mb-4 text-[#222222] dark:text-[#EAEAEA]">edit_document</span>
          <h3 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] mb-2">편집할 PDF 업로드</h3>
          <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666]">클릭하거나 드래그하여 파일을 첨부하세요</p>
          
          {isLoading && (
            <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-white">
              <span className="material-symbols-outlined text-5xl animate-spin mb-4">settings</span>
              <p className="font-black tracking-widest text-lg">페이지를 분석 중입니다...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 상단 액션 바 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-4 flex flex-col md:flex-row items-center justify-between shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] gap-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">picture_as_pdf</span>
              <div>
                <p className="font-bold text-[#222222] dark:text-[#EAEAEA]">{fileName}</p>
                <p className="text-xs font-mono text-[#666666] dark:text-[#A0A0A0]">총 {pages.length} 페이지 보존됨</p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={removeFile}
                className="flex-1 md:flex-none border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] px-6 py-3 font-bold hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || pages.length === 0}
                className="flex-1 md:flex-none bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] px-8 py-3 font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> 저장 중...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">save</span> 변경사항 저장</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#E5E4E0] dark:bg-[#111111] p-4 text-center">
             <p className="text-[#666666] dark:text-[#A0A0A0] text-sm font-bold flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">info</span>
                페이지를 드래그하여 순서를 변경하거나, 아래 버튼을 눌러 회전 및 삭제할 수 있습니다.
              </p>
          </div>

          {/* 썸네일 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {pages.map((page, index) => (
              <div 
                key={page.id}
                draggable
                onDragStart={(e) => onDragStartItem(e, index)}
                onDragOver={(e) => onDragOverItem(e, index)}
                onDragEnd={onDragEndItem}
                className={`bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] flex flex-col group cursor-grab active:cursor-grabbing transition-transform ${
                  draggedIdx === index ? "opacity-50 scale-95" : ""
                }`}
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-[1/1.4] bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] p-3 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-2 left-2 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] font-mono text-[10px] font-black px-1.5 py-0.5 z-10">
                    {index + 1}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={page.thumbnailUrl} 
                    alt={`Page ${index + 1}`} 
                    className="max-w-full max-h-full object-contain transition-transform duration-300 pointer-events-none shadow-sm"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                </div>
                
                {/* 컨트롤 버튼 */}
                <div className="flex divide-x-2 divide-[#222222] dark:divide-[#444444]">
                  <button 
                    onClick={() => rotatePage(page.id)}
                    className="flex-1 py-2 text-[#222222] dark:text-[#EAEAEA] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors flex items-center justify-center group/btn"
                    title="90도 회전"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:rotate-90 transition-transform">rotate_right</span>
                  </button>
                  <button 
                    onClick={() => deletePage(page.id)}
                    className="flex-1 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center group/btn"
                    title="페이지 삭제"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:scale-110 transition-transform">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {pages.length === 0 && (
             <div className="text-center py-20 text-[#A0A0A0]">
               <span className="material-symbols-outlined text-6xl mb-4">do_not_disturb_alt</span>
               <p className="font-bold">모든 페이지가 삭제되었습니다.</p>
             </div>
          )}

        </div>
      )}
    </div>
  );
}
