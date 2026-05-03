import { useState, useRef, useEffect, useCallback } from "react";
import { parsePdfDimensions, generateNestedPdf, MarkOption } from "../_lib/PdfProcessor";
import { packItems, PackItem, PlacedItem } from "../_lib/NestingEngine";

export interface UploadedFile {
  id: string;
  fileId: string;
  name: string;
  buffer: ArrayBuffer;
  pageIndex: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export function useRollNester() {
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
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
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
  const handleFileUpload = useCallback(async (uploadedFiles: FileList | File[]) => {
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
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // PDF 출력 내보내기
  const handleExport = useCallback(async () => {
    if (placedItems.length === 0) return alert("조판할 스티커가 없습니다.");
    setIsExporting(true);
    try {
      const fileBuffers: Record<string, ArrayBuffer> = {};
      files.forEach(f => fileBuffers[f.fileId] = f.buffer);

      const pdfBytes = await generateNestedPdf(placedItems, fileBuffers, totalWidth, totalHeight, markOption);
      
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
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
  }, [placedItems, files, totalWidth, totalHeight, markOption]);

  return {
    // State
    maxRollWidth, setMaxRollWidth,
    gutter, setGutter,
    files,
    placedItems,
    markOption, setMarkOption,
    isExporting,
    isDragging,
    previewUrl,
    isGenerating,
    
    // Handlers
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    updateFile,
    removeFile,
    handleExport
  };
}
