import { useState, useRef, useEffect, useCallback } from "react";
import type { MarkOption } from "../_lib/PdfProcessor";
import type { PackItem, PlacedItem } from "../_lib/NestingEngine";

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

export function useRollNester(initialMaxWidth: number = 600, initialGutter: number = 5) {
  const [maxRollWidth, setMaxRollWidth] = useState<number>(initialMaxWidth); 
  const [gutter, setGutter] = useState<number>(initialGutter); 
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

  // 알고리즘 실행: 파일 리스트, 용지폭, 여백이 변경될 때마다 자동 재조판 (서버 오프로딩)
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

    const marginMm = markOption === 'none' ? 0 : 15;
    const effectiveMaxWidth = Math.max(1, maxRollWidth - (marginMm * 2));

    fetch('/tools/rollnester/api/pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemsToPack, effectiveMaxWidth, gutter })
    })
    .then(res => res.json())
    .then(result => {
      if (result.error) throw new Error(result.error);
      setPlacedItems(result.placedItems);
      setTotalWidth(result.totalWidth);
      setTotalHeight(result.totalHeight);
    })
    .catch(err => console.error("Packing error:", err));
  }, [files, maxRollWidth, gutter, markOption]);

  // 미리보기 PDF 생성 (서버 오프로딩)
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
        const formData = new FormData();
        formData.append('payload', JSON.stringify({
          placedItems,
          totalWidthMm: totalWidth,
          totalHeightMm: totalHeight,
          markOption
        }));
        
        // 중복 파일 전송을 막기 위해 Set으로 관리
        const addedFiles = new Set<string>();
        files.forEach(f => {
          if (!addedFiles.has(f.fileId)) {
            const blob = new Blob([f.buffer], { type: "application/pdf" });
            formData.append(`file_${f.fileId}`, blob, f.name);
            addedFiles.add(f.fileId);
          }
        });

        const res = await fetch('/tools/rollnester/api/generate', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }

        const blob = await res.blob();
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
    }, 800); // 네트워크 딜레이를 고려해 디바운스를 800ms로 늘림

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedItems, totalWidth, totalHeight, markOption]);

  // PDF 업로드 및 파싱 (서버 오프로딩)
  const handleFileUpload = useCallback(async (uploadedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== "application/pdf") {
        alert(`${file.name}은(는) PDF 파일이 아닙니다.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/tools/rollnester/api/parse', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to parse");
        }

        const buffer = await file.arrayBuffer();
        const physicalFileId = Math.random().toString(36).substring(7);
        
        data.dimensions.forEach((dim: any, index: number) => {
          newFiles.push({
            id: Math.random().toString(36).substring(7),
            fileId: physicalFileId,
            name: data.dimensions.length > 1 ? `${file.name} (P.${index + 1})` : file.name,
            buffer,
            pageIndex: index,
            widthMm: Number(dim.widthMm.toFixed(1)),
            heightMm: Number(dim.heightMm.toFixed(1)),
            quantity: 1,
          });
        });
      } catch (err: any) {
        console.error("PDF Parse Error:", err);
        alert(`${file.name} 파싱 중 오류가 발생했습니다: ${err.message}`);
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

  // PDF 출력 내보내기 (서버 오프로딩)
  const handleExport = useCallback(async () => {
    if (placedItems.length === 0) return alert("조판할 스티커가 없습니다.");
    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify({
        placedItems,
        totalWidthMm: totalWidth,
        totalHeightMm: totalHeight,
        markOption
      }));
      
      const addedFiles = new Set<string>();
      files.forEach(f => {
        if (!addedFiles.has(f.fileId)) {
          const blob = new Blob([f.buffer], { type: "application/pdf" });
          formData.append(`file_${f.fileId}`, blob, f.name);
          addedFiles.add(f.fileId);
        }
      });

      const res = await fetch('/tools/rollnester/api/generate', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      const today = new Date().toISOString().slice(2,10).replace(/-/g, '.');
      const totalQty = files.reduce((acc, f) => acc + f.quantity, 0);
      a.href = url;
      a.download = `${today}_${files.length}종_${totalQty}개_실사출력.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(`PDF 생성 중 오류가 발생했습니다: ${err.message}`);
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
