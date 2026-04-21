"use client";

import { useState } from "react";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function PdfToImgPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // 변환 옵션
  const [dpi, setDpi] = useState<number>(300);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");

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
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        setFileBuffer(buffer);

        // 첫 페이지 썸네일 생성 및 총 페이지 수 확인
        const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        setTotalPages(pdf.numPages);
        
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          setPreviewUrl(canvas.toDataURL("image/jpeg", 0.7));
        }
      } catch (err) {
        console.error(err);
        alert("PDF 로드 오류가 발생했습니다.");
        removeFile();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null);
    setFileBuffer(null);
    setTotalPages(0);
    setPreviewUrl(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleExtract = async () => {
    if (!fileBuffer) return;
    setIsExtracting(true);

    try {
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
      const total = pdf.numPages;
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "document";
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      
      // PDF 기본 DPI는 72입니다.
      // 따라서 300DPI를 원한다면 300 / 72 = 약 4.166배 확대하여 캔버스에 렌더링해야 합니다.
      const scale = dpi / 72;

      const zip = new JSZip();

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // JPEG는 투명도를 지원하지 않으므로 배경을 흰색으로 채움
          if (format === "jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // 인쇄 품질을 높이기 위한 안티앨리어싱 등의 렌더링 옵션 (pdfjs 내부적으로 최적화됨)
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          
          const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
          const quality = format === "jpeg" ? 1.0 : undefined; // PNG는 무손실 압축
          const dataUrl = canvas.toDataURL(mimeType, quality);
          
          if (total === 1) {
            // 단일 페이지일 경우 ZIP 압축 없이 바로 다운로드
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `${today}_${baseName}_${dpi}DPI.${format}`;
            a.click();
            setIsExtracting(false);
            return;
          } else {
            // 멀티 페이지일 경우 ZIP에 파일 추가
            const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            zip.file(`${baseName}_${dpi}DPI_P${i}.${format}`, base64Data, { base64: true });
          }
        }
      }

      // ZIP 생성 및 다운로드 (다중 페이지)
      if (total > 1) {
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipContent);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${today}_${baseName}_${dpi}DPI_이미지.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert("이미지 변환 중 오류가 발생했습니다. 메모리가 부족할 수 있습니다.");
    } finally {
      setIsExtracting(false);
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
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 05
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              고해상도 이미지 추출기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 고화질 이미지 변환
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 왼쪽: 파일 업로드 */}
        <div className="space-y-6">
          <div 
            className={`bg-white dark:bg-[#1E1E1E] border-4 border-dashed border-[#222222] dark:border-[#444444] p-8 h-80 flex flex-col items-center justify-center relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] ${
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
                <span className="material-symbols-outlined text-6xl mb-4 text-[#222222] dark:text-[#EAEAEA]">imagesmode</span>
                <p className="text-xl font-black text-[#222222] dark:text-[#EAEAEA]">PDF 원고 업로드</p>
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mt-2">클릭하거나 드래그하여 첨부</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-20 relative w-full px-4 h-full">
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="Preview" className="h-28 object-contain shadow-md border-2 border-[#222222] dark:border-[#444444] mb-4 bg-white" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400 mb-3">picture_as_pdf</span>
                )}
                <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-full">{fileName}</p>
                <div className="mt-2 inline-flex items-center gap-2 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-3 py-1 font-mono font-bold text-xs">
                  총 {totalPages} 페이지
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); removeFile(); }} 
                  className="mt-auto text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] px-4 py-1 text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">close</span> 파일 지우기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 변환 옵션 및 추출 */}
        <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-6 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col justify-between h-80">
          <div>
            <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-6 flex items-center gap-2 border-b-2 border-[#222222] dark:border-[#444444] pb-3">
              <span className="material-symbols-outlined">tune</span> 출력 옵션 설정
            </h3>
            
            <div className="space-y-6">
              {/* 포맷 설정 */}
              <div>
                <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">이미지 포맷 (Format)</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFormat('jpeg')}
                    className={`flex-1 border-2 py-2 font-bold text-sm transition-colors ${format === 'jpeg' ? 'border-[#222222] dark:border-[#EAEAEA] bg-[#222222] text-white dark:bg-[#EAEAEA] dark:text-[#121212]' : 'border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA]'}`}
                  >
                    JPG (웹 최적화)
                  </button>
                  <button 
                    onClick={() => setFormat('png')}
                    className={`flex-1 border-2 py-2 font-bold text-sm transition-colors ${format === 'png' ? 'border-[#222222] dark:border-[#EAEAEA] bg-[#222222] text-white dark:bg-[#EAEAEA] dark:text-[#121212]' : 'border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA]'}`}
                  >
                    PNG (무손실/투명도)
                  </button>
                </div>
              </div>

              {/* 해상도 설정 */}
              <div>
                <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">해상도 품질 (Resolution)</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setDpi(72)}
                    className={`flex-1 border-2 py-2 font-bold text-xs flex flex-col items-center justify-center transition-colors ${dpi === 72 ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300' : 'border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA]'}`}
                  >
                    <span>72 DPI</span>
                    <span className="font-normal text-[10px] mt-0.5 opacity-70">모니터용</span>
                  </button>
                  <button 
                    onClick={() => setDpi(150)}
                    className={`flex-1 border-2 py-2 font-bold text-xs flex flex-col items-center justify-center transition-colors ${dpi === 150 ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300' : 'border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA]'}`}
                  >
                    <span>150 DPI</span>
                    <span className="font-normal text-[10px] mt-0.5 opacity-70">사무용 인쇄</span>
                  </button>
                  <button 
                    onClick={() => setDpi(300)}
                    className={`flex-1 border-2 py-2 font-bold text-xs flex flex-col items-center justify-center transition-colors ${dpi === 300 ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300' : 'border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#EAEAEA]'}`}
                  >
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">star</span> 300 DPI</span>
                    <span className="font-normal text-[10px] mt-0.5 opacity-70">상업 인쇄용</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleExtract}
            disabled={!fileBuffer || isExtracting || totalPages === 0}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
          >
            {isExtracting ? (
              <>
                <span className="material-symbols-outlined animate-spin">autorenew</span> 변환 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">download</span> 이미지로 다운로드
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
