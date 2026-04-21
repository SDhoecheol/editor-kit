"use client";

import { useState } from "react";
import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from "pdf-lib";

async function compressImageBytes(jpegBytes: Uint8Array, quality: number, scaleFactor: number): Promise<{bytes: Uint8Array, width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(img.width * scaleFactor));
      canvas.height = Math.max(1, Math.floor(img.height * scaleFactor));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("No canvas context"));
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((outBlob) => {
         if (!outBlob) return reject(new Error("Canvas toBlob failed"));
         outBlob.arrayBuffer().then(ab => resolve({
             bytes: new Uint8Array(ab),
             width: canvas.width,
             height: canvas.height
         }));
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

export default function PdfCompressTargetPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // 압축 옵션: 10% ~ 90%
  const [reduction, setReduction] = useState<number>(30);
  
  // 결과 상태
  const [resultSize, setResultSize] = useState<number | null>(null);

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
    setOriginalSize(file.size);
    setResultSize(null);
    
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
    setOriginalSize(0);
    setResultSize(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleCompress = async () => {
    if (!fileBuffer) return;
    setIsCompressing(true);

    try {
      const doc = await PDFDocument.load(fileBuffer);
      const context = doc.context;
      const enumerateObjects = context.enumerateIndirectObjects();
      
      let scaleFactor = 1.0;
      let quality = 0.8;
      
      if (reduction >= 61) {
        scaleFactor = 72 / 300; // 약 0.24배 (저화질)
        quality = 0.4;
      } else if (reduction >= 31) {
        scaleFactor = 150 / 300; // 0.5배 (보통 화질)
        quality = 0.6;
      } else {
        scaleFactor = 1.0; // 원본 해상도 유지
        quality = 0.9 - (reduction * 0.01); // 0.8 ~ 0.6 (고화질)
      }

      for (const [ref, pdfObject] of enumerateObjects) {
        if (!(pdfObject instanceof PDFRawStream)) continue;
        
        const dict = pdfObject.dict;
        if (dict.get(PDFName.of('Subtype')) !== PDFName.of('Image')) continue;
        
        // JPEG인지 확인
        const filter = dict.lookup(PDFName.of('Filter'));
        let isJpeg = false;
        if (filter === PDFName.of('DCTDecode')) {
          isJpeg = true;
        } else if (Array.isArray(filter) && filter.includes(PDFName.of('DCTDecode'))) {
          isJpeg = true;
        }

        if (isJpeg) {
          try {
            const rawBytes = pdfObject.contents;
            if (!rawBytes) continue;
            
            // 캔버스를 이용해 JPEG 압축 및 해상도 조절
            const { bytes: compressedBytes, width, height } = await compressImageBytes(rawBytes, quality, scaleFactor);
            
            // 스트림 데이터를 새 압축 데이터로 직접 교체 (In-place Swap)
            pdfObject.contents = compressedBytes;
            
            // 딕셔너리 정보(크기, 해상도, 컬러) 업데이트
            pdfObject.dict.set(PDFName.of('Length'), PDFNumber.of(compressedBytes.length));
            pdfObject.dict.set(PDFName.of('Width'), PDFNumber.of(width));
            pdfObject.dict.set(PDFName.of('Height'), PDFNumber.of(height));
            // 캔버스 추출물은 무조건 RGB이므로 컬러 스페이스도 일치시킴
            pdfObject.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
            pdfObject.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
          } catch (imgErr) {
            console.warn("Failed to compress image stream", imgErr);
          }
        }
      }

      const pdfBytes = await doc.save();
      setResultSize(pdfBytes.byteLength);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "document";
      a.download = `압축완료_${baseName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("압축 처리 중 오류가 발생했습니다. (일부 벡터나 폰트가 렌더링되지 않는 PDF일 수 있습니다)");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const targetSize = originalSize * (1 - (reduction / 100));

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 07
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              벡터 보존형 이미지 전용 압축기
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            스마트 PDF 압축
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 왼쪽: 파일 업로드 영역 */}
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
              accept=".pdf" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            {!fileName ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-4 text-[#222222] dark:text-[#EAEAEA]">compress</span>
                <p className="text-xl font-black text-[#222222] dark:text-[#EAEAEA]">무거운 PDF 업로드</p>
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mt-2">텍스트와 벡터는 손상되지 않습니다.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-20 relative w-full h-full p-2 justify-center">
                <span className="material-symbols-outlined text-6xl text-red-600 dark:text-red-400 mb-4">picture_as_pdf</span>
                <p className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] truncate w-full mb-2">{fileName}</p>
                <div className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-4 py-2 font-mono font-black text-xl mb-6">
                  {formatBytes(originalSize)}
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); removeFile(); }} 
                  className="text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center justify-center border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] px-4 py-2 text-sm font-bold"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">close</span> 다른 파일 선택
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 압축 컨트롤 패널 */}
        <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-6 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col justify-between h-[400px]">
          <div>
            <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2 border-b-2 border-[#222222] dark:border-[#444444] pb-3">
              <span className="material-symbols-outlined">tune</span> 용량 다이어트 목표
            </h3>
            
            <div className="space-y-6 mt-4">
              {/* 슬라이더 영역 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA]">
                    감축 비율 설정 (Reduce by)
                  </label>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {reduction}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="10" max="90" step="5"
                  value={reduction} 
                  onChange={(e) => setReduction(parseInt(e.target.value))}
                  className="w-full h-3 bg-[#E5E4E0] dark:bg-[#444444] appearance-none cursor-pointer border border-[#222222] dark:border-[#111111]"
                  style={{ accentColor: '#2563eb' }}
                />
              </div>

              {/* 실시간 시뮬레이션 결과 */}
              <div className="bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">목표 용량 (Target Size)</span>
                  <span className="text-xl font-black font-mono text-[#222222] dark:text-[#EAEAEA]">
                    약 {formatBytes(targetSize)}
                  </span>
                </div>
                <div className="h-px bg-[#E5E4E0] dark:bg-[#333333] w-full my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">예상 화질 (Quality)</span>
                  <div className="flex items-center gap-1 font-black text-sm">
                    {reduction >= 61 ? (
                      <span className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 border border-red-200 dark:border-red-800">72 DPI 저화질 주의</span>
                    ) : reduction >= 31 ? (
                      <span className="text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 border border-orange-200 dark:border-orange-800">150 DPI 보통</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 border border-green-200 dark:border-green-800">원본 해상도 유지</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 결과 출력란 */}
              {resultSize !== null && (
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-500 p-3 animate-pulse">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300">압축 완료! 실제 최종 용량:</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">{formatBytes(resultSize)}</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleCompress}
            disabled={!fileBuffer || isCompressing}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shrink-0 relative overflow-hidden"
          >
            {isCompressing ? (
              <>
                <span className="material-symbols-outlined animate-spin relative z-10">autorenew</span> 
                <span className="relative z-10">최적의 화질 지점 계산 중...</span>
                <div className="absolute inset-0 bg-blue-600 dark:bg-blue-500 opacity-20 animate-pulse"></div>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">zoom_in_map</span> 스마트 압축 시작
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
