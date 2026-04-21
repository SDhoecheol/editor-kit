"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function PdfMergePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleFileUpload = (uploadedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type === "application/pdf") {
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          size: file.size,
        });
      } else {
        alert(`${file.name}은(는) PDF 파일이 아닙니다.`);
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  // 파일 업로드 드래그 앤 드롭
  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeaveUpload = () => setIsDraggingFile(false);
  const handleDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  // 리스트 아이템 순서 변경 드래그 앤 드롭
  const handleDragStartItem = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // 파이어폭스 등 일부 브라우저 호환성을 위해 빈 데이터 셋팅
    e.dataTransfer.setData("text/plain", index.toString());
    
    // 드래그 시 고스트 이미지 디자인 설정 (선택사항)
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...files];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setFiles(newFiles);
  };

  const handleDragEndItem = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return alert("병합할 PDF 파일을 2개 이상 올려주세요.");
    setIsMerging(true);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const f of files) {
        const buffer = await f.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      a.download = `${today}_병합된_문서_${files.length}종.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF 병합 중 오류가 발생했습니다. 암호가 걸려있거나 손상된 파일일 수 있습니다.");
    } finally {
      setIsMerging(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 05
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              PDF 간편 병합기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 병합
          </h1>
        </div>
      </header>

      <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-8 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111]">
        
        {/* 드래그 앤 드롭 업로드 영역 */}
        <div 
          className={`border-4 border-dashed transition-all p-12 text-center relative mb-8 ${
            isDraggingFile ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-[#A0A0A0] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212]"
          }`}
          onDragOver={handleDragOverUpload}
          onDragLeave={handleDragLeaveUpload}
          onDrop={handleDropUpload}
        >
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span className="material-symbols-outlined text-5xl mb-4 text-[#A0A0A0] dark:text-[#666666]">note_add</span>
          <h3 className="text-xl font-black text-[#222222] dark:text-[#EAEAEA] mb-2">PDF 파일을 이곳에 드롭하세요</h3>
          <p className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">클릭하여 탐색기에서 선택할 수도 있습니다</p>
        </div>

        {/* 파일 리스트 및 순서 변경 영역 */}
        {files.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">list</span>
              병합 대기 목록 ({files.length}개)
              <span className="text-xs font-bold text-[#A0A0A0] ml-2 font-normal">드래그하여 병합될 순서를 변경할 수 있습니다.</span>
            </h3>
            
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li 
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStartItem(e, index)}
                  onDragOver={(e) => handleDragOverItem(e, index)}
                  onDragEnd={handleDragEndItem}
                  className={`bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#444444] p-3 flex items-center gap-4 transition-transform ${
                    draggedIndex === index ? "opacity-50 scale-[0.98]" : "opacity-100 hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111]"
                  }`}
                >
                  <div className="cursor-grab text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] active:cursor-grabbing flex items-center justify-center p-1">
                    <span className="material-symbols-outlined">drag_indicator</span>
                  </div>
                  <div className="flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 border border-red-200 dark:border-red-800">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate">{file.name}</p>
                    <p className="text-xs text-[#666666] dark:text-[#A0A0A0] font-mono mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <div className="font-black text-[#A0A0A0] dark:text-[#666666] text-xl px-4 font-mono">
                    #{index + 1}
                  </div>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-[#222222] dark:hover:border-[#EAEAEA] text-[#A0A0A0] hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="border-t-4 border-[#222222] dark:border-[#444444] pt-8">
          <button 
            onClick={handleMerge}
            disabled={files.length < 2 || isMerging}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-5 text-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isMerging ? (
              <>
                <span className="material-symbols-outlined animate-spin">autorenew</span>
                병합 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">merge</span>
                {files.length < 2 ? "PDF 파일을 2개 이상 올려주세요" : "파일 병합 다운로드"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
