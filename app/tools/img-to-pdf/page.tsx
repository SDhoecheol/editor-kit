"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";

export default function ImgToPdfPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBuffer, setImageBuffer] = useState<ArrayBuffer | null>(null);
  const [imgWidthPx, setImgWidthPx] = useState<number>(0);
  const [imgHeightPx, setImgHeightPx] = useState<number>(0);
  const [imgType, setImgType] = useState<string>("");
  
  const [widthMm, setWidthMm] = useState<string>("210"); // Default A4 가로
  const [heightMm, setHeightMm] = useState<string>("297"); // Default A4 세로
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // DPI 실시간 계산
  const wMm = parseFloat(widthMm) || 0;
  const wInches = wMm / 25.4;
  const currentDpi = wInches > 0 ? Math.round(imgWidthPx / wInches) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let file: File | null = null;
    if (e instanceof FileList) {
      file = e[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('이미지 파일(JPG, PNG 등)만 가능합니다.');

    setFileName(file.name);
    setImgType(file.type);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      setImageBuffer(buffer);
      
      // 이미지 픽셀 해상도 분석용 Blob URL 생성
      const blob = new Blob([buffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      const img = new Image();
      img.onload = () => {
        setImgWidthPx(img.width);
        setImgHeightPx(img.height);
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFileName(null);
    setImageBuffer(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImgWidthPx(0);
    setImgHeightPx(0);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleGenerate = async () => {
    if (!imageBuffer) return;
    if (wMm <= 0 || parseFloat(heightMm) <= 0) return alert("올바른 mm 수치를 입력해주세요.");
    
    setIsGenerating(true);

    try {
      const pdfDoc = await PDFDocument.create();
      
      // mm to pt (1 mm = 2.83465 pt)
      const MM_TO_PT = 2.83465;
      const wPt = wMm * MM_TO_PT;
      const hPt = parseFloat(heightMm) * MM_TO_PT;

      const page = pdfDoc.addPage([wPt, hPt]);

      // pdf-lib은 JPG와 PNG를 지원
      let pdfImage;
      if (imgType === 'image/jpeg' || imgType === 'image/jpg') {
        pdfImage = await pdfDoc.embedJpg(imageBuffer);
      } else if (imgType === 'image/png') {
        pdfImage = await pdfDoc.embedPng(imageBuffer);
      } else {
        alert("지원하지 않는 이미지 형식입니다. JPG 또는 PNG를 사용해주세요.");
        setIsGenerating(false);
        return;
      }

      // 이미지를 페이지 전체에 꽉 채워 배치 (비율 무시하고 지정한 mm 사이즈로 강제 피팅)
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: wPt,
        height: hPt,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "image";
      a.download = `${today}_${baseName}_${wMm}x${heightMm}mm.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  // 비율 동기화 로직 (옵션: 사용자가 원본 비율을 유지하고 싶을 때)
  const applyOriginalRatio = () => {
    if (imgWidthPx > 0 && imgHeightPx > 0 && wMm > 0) {
      const ratio = imgHeightPx / imgWidthPx;
      setHeightMm((wMm * ratio).toFixed(1));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 06
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄 규격 맞춤 변환기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            이미지 PDF 변환
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 왼쪽: 파일 업로드 */}
        <div className="space-y-6">
          <div 
            className={`bg-white dark:bg-[#1E1E1E] border-4 border-dashed border-[#222222] dark:border-[#444444] p-8 h-[400px] flex flex-col items-center justify-center relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] ${
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              accept="image/jpeg, image/png" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            {!imageUrl ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-4 text-[#222222] dark:text-[#EAEAEA]">add_photo_alternate</span>
                <p className="text-xl font-black text-[#222222] dark:text-[#EAEAEA]">이미지 원고 업로드</p>
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mt-2">JPG, PNG 파일 첨부 가능</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-20 relative w-full h-full p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Uploaded" className="h-40 object-contain shadow-md border-2 border-[#222222] dark:border-[#444444] mb-4 bg-[#F5F4F0] dark:bg-[#121212]" />
                <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-full mb-1">{fileName}</p>
                <p className="text-xs font-mono text-[#666666] dark:text-[#A0A0A0]">원본 해상도: {imgWidthPx} x {imgHeightPx} px</p>
                <button 
                  onClick={(e) => { e.preventDefault(); removeFile(); }} 
                  className="mt-auto text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] px-4 py-1 text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">close</span> 지우기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 사이즈 및 다운로드 */}
        <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-6 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col justify-between h-[400px]">
          <div>
            <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-6 flex items-center gap-2 border-b-2 border-[#222222] dark:border-[#444444] pb-3">
              <span className="material-symbols-outlined">straighten</span> 실제 인쇄 규격 (mm)
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black text-[#666666] dark:text-[#A0A0A0] mb-2 uppercase tracking-widest">가로 폭 (Width)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={widthMm} 
                      onChange={(e) => setWidthMm(e.target.value)} 
                      className="w-full border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] px-4 py-3 text-2xl font-bold text-[#222222] dark:text-[#EAEAEA] outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#A0A0A0]">mm</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center px-2 pt-6 text-[#A0A0A0]">
                  <span className="material-symbols-outlined">close</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black text-[#666666] dark:text-[#A0A0A0] mb-2 uppercase tracking-widest">세로 높이 (Height)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={heightMm} 
                      onChange={(e) => setHeightMm(e.target.value)} 
                      className="w-full border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] px-4 py-3 text-2xl font-bold text-[#222222] dark:text-[#EAEAEA] outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#A0A0A0]">mm</span>
                  </div>
                </div>
              </div>

              {imageUrl && (
                <button 
                  onClick={applyOriginalRatio}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
                  원본 이미지 비율에 맞춰 세로 높이 자동 계산
                </button>
              )}

              {/* 실시간 DPI 품질 경고창 */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#444444]">
                <h4 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-2">예상 출력 화질</h4>
                {currentDpi === 0 ? (
                  <p className="text-sm text-[#A0A0A0] font-bold">이미지를 업로드하면 예상 품질을 알려드립니다.</p>
                ) : (
                  <div className={`p-3 border-l-4 flex items-start gap-3 ${
                    currentDpi >= 300 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                    currentDpi >= 150 ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                    'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}>
                    <span className="material-symbols-outlined mt-0.5">
                      {currentDpi >= 300 ? 'check_circle' : currentDpi >= 150 ? 'warning' : 'error'}
                    </span>
                    <div>
                      <p className="font-black">해상도: 약 {currentDpi} DPI</p>
                      <p className="text-xs mt-1 font-bold opacity-80">
                        {currentDpi >= 300 ? '인쇄용으로 아주 훌륭한 화질입니다! (선명함)' :
                         currentDpi >= 150 ? '일반 사무용이나 큰 포스터 인쇄는 가능하나, 가까이서 보면 약간 흐릿할 수 있습니다.' :
                         '화질이 너무 낮습니다! 출력 시 모자이크처럼 깨져 보일 확률이 매우 높습니다. 더 큰 원본 이미지를 구하세요.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!imageBuffer || isGenerating}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shrink-0"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin">autorenew</span> 생성 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">picture_as_pdf</span> PDF 생성 및 다운로드
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
