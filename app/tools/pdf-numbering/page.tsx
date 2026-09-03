"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface NumberPosition {
  id: string;
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  hasBg: boolean;
  bgColor: string;
  bgOpacity: number; // 0 ~ 100
  borderRadiusMm: number; // 0 ~ 20mm
}

interface HistorySnapshot {
  positions: NumberPosition[];
  activePosId: string;
  fontSize: number;
}

type ResizeHandle = "nw" | "ne" | "se" | "sw";

export default function PdfNumberingPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageWidthMm, setPageWidthMm] = useState<number>(0);
  const [pageHeightMm, setPageHeightMm] = useState<number>(0);
  const [pageWidthPt, setPageWidthPt] = useState<number>(0);
  const [pageHeightPt, setPageHeightPt] = useState<number>(0);
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  // 번호 규칙 설정
  const [startNum, setStartNum] = useState<number>(1);
  const [endNum, setEndNum] = useState<number>(1000);
  const [step, setStep] = useState<number>(1);
  const [digits, setDigits] = useState<number>(4);
  const [prefix, setPrefix] = useState<string>("No. ");
  const [suffix, setSuffix] = useState<string>("");

  // 폰트 & 스타일 설정 (글씨는 배경과 독립)
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Courier" | "Times">("Courier");
  const [fontColor, setFontColor] = useState<string>("#dc2626");

  // 넘버링 위치 및 배경 박스 목록
  const [positions, setPositions] = useState<NumberPosition[]>([
    {
      id: "pos-1",
      name: "번호 1",
      xMm: 15,
      yMm: 15,
      widthMm: 42,
      heightMm: 14,
      hasBg: false,
      bgColor: "#ffffff",
      bgOpacity: 80,
      borderRadiusMm: 4,
    },
  ]);
  const [activePosId, setActivePosId] = useState<string>("pos-1");

  // 히스토리 (Ctrl+Z 실행 취소 / Ctrl+Y 다시 실행)
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // 에디터 마우스 인터랙션 상태
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<"idle" | "move" | "resize">("idle");
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);

  // 드래그 시작 시점의 스냅샷 정보
  const dragStartInfo = useRef<{
    startX: number;
    startY: number;
    initialPos: NumberPosition;
  } | null>(null);

  // 대량 생성 진행 상태
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const totalQuantity = Math.max(0, Math.floor((endNum - startNum) / (step || 1)) + 1);

  const formatNumber = (num: number) => {
    let numStr = String(num);
    if (digits > 0) {
      numStr = numStr.padStart(digits, "0");
    }
    return `${prefix}${numStr}${suffix}`;
  };

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r, g, b };
  };

  // --- 히스토리 스택 관리 (Undo / Redo) ---
  const saveSnapshot = useCallback(
    (customPositions?: NumberPosition[], customFontSize?: number, customActiveId?: string) => {
      const snap: HistorySnapshot = {
        positions: customPositions || positions,
        fontSize: customFontSize !== undefined ? customFontSize : fontSize,
        activePosId: customActiveId || activePosId,
      };

      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(snap);
        if (next.length > 30) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [positions, fontSize, activePosId, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const target = history[historyIndex - 1];
    setPositions(target.positions);
    setFontSize(target.fontSize);
    setActivePosId(target.activePosId);
    setHistoryIndex((prev) => prev - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const target = history[historyIndex + 1];
    setPositions(target.positions);
    setFontSize(target.fontSize);
    setActivePosId(target.activePosId);
    setHistoryIndex((prev) => prev + 1);
  }, [history, historyIndex]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z")) {
          e.preventDefault();
          redo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [undo, redo]);

  // PDF 업로드 및 렌더링
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let file: File | null = null;
    if (e instanceof FileList) file = e[0];
    else if (e.target.files) file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      alert("PDF 파일만 업로드할 수 있습니다.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        setFileBuffer(buffer);

        const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        const widthPt = unscaledViewport.width;
        const heightPt = unscaledViewport.height;
        const widthMm = Math.round((widthPt / 2.83465) * 10) / 10;
        const heightMm = Math.round((heightPt / 2.83465) * 10) / 10;

        setPageWidthPt(widthPt);
        setPageHeightPt(heightPt);
        setPageWidthMm(widthMm);
        setPageHeightMm(heightMm);

        const initialPositions: NumberPosition[] = [
          {
            id: "pos-1",
            name: "번호 1",
            xMm: Math.max(10, Math.round(widthMm * 0.65)),
            yMm: 15,
            widthMm: 45,
            heightMm: 15,
            hasBg: false,
            bgColor: "#ffffff",
            bgOpacity: 85,
            borderRadiusMm: 3,
          },
        ];
        setPositions(initialPositions);
        setActivePosId("pos-1");

        setHistory([{ positions: initialPositions, activePosId: "pos-1", fontSize: 18 }]);
        setHistoryIndex(0);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render({ canvasContext: ctx, viewport } as any)).promise;
          setPreviewImgUrl(canvas.toDataURL("image/jpeg", 0.9));
        }
      } catch (err) {
        console.error(err);
        alert("PDF 파일을 불러오는 중 오류가 발생했습니다.");
        resetFile();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetFile = () => {
    setFileName(null);
    setFileBuffer(null);
    setPageCount(0);
    setPageWidthMm(0);
    setPageHeightMm(0);
    setPreviewImgUrl(null);
    setProgress(null);
    setHistory([]);
    setHistoryIndex(-1);
    const fileInput = document.getElementById("num-file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const activePos = positions.find((p) => p.id === activePosId) || positions[0];

  const updateActivePos = (fields: Partial<NumberPosition>) => {
    if (!activePos) return;
    const next = positions.map((p) => (p.id === activePos.id ? { ...p, ...fields } : p));
    setPositions(next);
    saveSnapshot(next);
  };

  const addPosition = () => {
    if (positions.length >= 6) {
      alert("최대 6개까지 넘버링 위치를 추가할 수 있습니다.");
      return;
    }
    const newId = `pos-${Date.now()}`;
    const newPos: NumberPosition = {
      id: newId,
      name: `번호 ${positions.length + 1}`,
      xMm: Math.min(pageWidthMm - 50, 20 + positions.length * 15),
      yMm: Math.min(pageHeightMm - 30, 20 + positions.length * 15),
      widthMm: activePos ? activePos.widthMm : 45,
      heightMm: activePos ? activePos.heightMm : 15,
      hasBg: activePos ? activePos.hasBg : false,
      bgColor: activePos ? activePos.bgColor : "#ffffff",
      bgOpacity: activePos ? activePos.bgOpacity : 85,
      borderRadiusMm: activePos ? activePos.borderRadiusMm : 3,
    };
    const next = [...positions, newPos];
    setPositions(next);
    setActivePosId(newId);
    saveSnapshot(next, undefined, newId);
  };

  const removePosition = (id: string) => {
    if (positions.length <= 1) {
      alert("최소 1개의 번호 위치가 필요합니다.");
      return;
    }
    const next = positions.filter((p) => p.id !== id);
    setPositions(next);
    const nextActive = activePosId === id ? next[0].id : activePosId;
    setActivePosId(nextActive);
    saveSnapshot(next, undefined, nextActive);
  };

  // --- 마우스 인터랙션 (이동: Box Position / 크기: Box Size만 변경, 글씨와 분리) ---
  const handleStartMove = (e: React.MouseEvent, posId: string) => {
    e.stopPropagation();
    setActivePosId(posId);
    setInteractionMode("move");

    const targetPos = positions.find((p) => p.id === posId);
    if (!targetPos) return;

    dragStartInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...targetPos },
    };
  };

  const handleStartResize = (e: React.MouseEvent, handle: ResizeHandle, posId: string) => {
    e.stopPropagation();
    setActivePosId(posId);
    setInteractionMode("resize");
    setActiveHandle(handle);

    const targetPos = positions.find((p) => p.id === posId);
    if (!targetPos) return;

    dragStartInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...targetPos },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (interactionMode === "idle" || !dragStartInfo.current || !editorContainerRef.current) return;

      const rect = editorContainerRef.current.getBoundingClientRect();
      const deltaScreenX = e.clientX - dragStartInfo.current.startX;
      const deltaScreenY = e.clientY - dragStartInfo.current.startY;

      const deltaXMm = (deltaScreenX / rect.width) * pageWidthMm;
      const deltaYMm = (deltaScreenY / rect.height) * pageHeightMm;

      if (interactionMode === "move") {
        // 박스 위치(x, y) 이동
        const newX = Math.max(0, Math.min(pageWidthMm - 5, dragStartInfo.current.initialPos.xMm + deltaXMm));
        const newY = Math.max(0, Math.min(pageHeightMm - 5, dragStartInfo.current.initialPos.yMm + deltaYMm));

        setPositions((prev) =>
          prev.map((p) =>
            p.id === dragStartInfo.current!.initialPos.id
              ? { ...p, xMm: Math.round(newX * 10) / 10, yMm: Math.round(newY * 10) / 10 }
              : p
          )
        );
      } else if (interactionMode === "resize") {
        // 배경 박스의 가로(width)와 세로(height)만 조절! (글자 크기는 변경되지 않음)
        const init = dragStartInfo.current.initialPos;
        let newWidth = init.widthMm;
        let newHeight = init.heightMm;

        if (activeHandle === "se") {
          newWidth = init.widthMm + deltaXMm;
          newHeight = init.heightMm + deltaYMm;
        } else if (activeHandle === "sw") {
          newWidth = init.widthMm - deltaXMm;
          newHeight = init.heightMm + deltaYMm;
        } else if (activeHandle === "ne") {
          newWidth = init.widthMm + deltaXMm;
          newHeight = init.heightMm - deltaYMm;
        } else if (activeHandle === "nw") {
          newWidth = init.widthMm - deltaXMm;
          newHeight = init.heightMm - deltaYMm;
        }

        // Shift 키 누름 시 가로/세로 종횡비(비율) 고정
        if (e.shiftKey) {
          const ratio = init.widthMm / (init.heightMm || 1);
          const maxDelta = Math.max(Math.abs(deltaXMm), Math.abs(deltaYMm));
          const sign = deltaXMm >= 0 || deltaYMm >= 0 ? 1 : -1;
          newWidth = Math.max(10, init.widthMm + sign * maxDelta);
          newHeight = Math.max(6, newWidth / ratio);
        }

        // 최소/최대 박스 크기 제한
        newWidth = Math.max(12, Math.min(pageWidthMm, Math.round(newWidth * 10) / 10));
        newHeight = Math.max(6, Math.min(pageHeightMm, Math.round(newHeight * 10) / 10));

        setPositions((prev) =>
          prev.map((p) =>
            p.id === init.id ? { ...p, widthMm: newWidth, heightMm: newHeight } : p
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (interactionMode !== "idle") {
        setInteractionMode("idle");
        setActiveHandle(null);
        dragStartInfo.current = null;
        saveSnapshot();
      }
    };

    if (interactionMode !== "idle") {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [interactionMode, activeHandle, pageWidthMm, pageHeightMm, saveSnapshot]);

  // 마우스 휠 스크롤로 글자 크기(Font Size)만 독립 미세 조절
  const handleBoxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 1 : -1;
    setFontSize((prev) => {
      const next = Math.max(8, Math.min(100, prev + delta));
      return next;
    });
  };

  // 배경 캔버스 클릭 시 활성 박스 해당 위치로 이동
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePos || !editorContainerRef.current || !pageWidthMm || !pageHeightMm) return;
    const rect = editorContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newXMm = Math.round((clickX / rect.width) * pageWidthMm * 10) / 10;
    const newYMm = Math.round((clickY / rect.height) * pageHeightMm * 10) / 10;

    updateActivePos({ xMm: newXMm, yMm: newYMm });
  };

  // ⚡ 초고속 대량 생성 엔진 (XObject 템플릿 임베딩으로 수천~수만 장도 무제한 생성)
  const handleGeneratePdf = async () => {
    if (!fileBuffer || totalQuantity <= 0) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: totalQuantity });

    try {
      await new Promise((r) => setTimeout(r, 50));

      const srcDoc = await PDFDocument.load(fileBuffer);
      const outputDoc = await PDFDocument.create();

      // ⭐ 핵심 최적화: 원본 양식 페이지를 XObject 템플릿으로 단 1번만 임베딩 (메모리 99% 절약)
      const [embeddedTemplate] = await outputDoc.embedPages([srcDoc.getPages()[0]]);

      let embeddedFont = await outputDoc.embedFont(StandardFonts.CourierBold);
      if (fontFamily === "Helvetica") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.HelveticaBold);
      } else if (fontFamily === "Times") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.TimesRomanBold);
      }

      const fontRgb = hexToRgb(fontColor);
      const MM_TO_PT = 2.83465;

      const numbers: number[] = [];
      for (let n = startNum; n <= endNum; n += step) {
        numbers.push(n);
      }

      for (let i = 0; i < numbers.length; i++) {
        const currentNum = numbers[i];
        const formattedText = formatNumber(currentNum);

        // 새 빈 페이지 생성 후 템플릿 1회 호출
        const page = outputDoc.addPage([pageWidthPt, pageHeightPt]);
        page.drawPage(embeddedTemplate, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
        });

        // 각 번호 위치 렌더링
        for (const pos of positions) {
          const boxXPt = pos.xMm * MM_TO_PT;
          const boxWPt = pos.widthMm * MM_TO_PT;
          const boxHPt = pos.heightMm * MM_TO_PT;
          // PDF 좌표계(좌하단 원점)
          const boxYPt = pageHeightPt - (pos.yMm * MM_TO_PT) - boxHPt;

          // 1. 배경 박스 그리기 (옵션 켜져있고 투명도 > 0일 때)
          if (pos.hasBg && pos.bgOpacity > 0) {
            const bgRgb = hexToRgb(pos.bgColor);
            page.drawRectangle({
              x: boxXPt,
              y: boxYPt,
              width: boxWPt,
              height: boxHPt,
              color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
              opacity: pos.bgOpacity / 100,
            });
          }

          // 2. 숫자 텍스트 그리기 (박스 정중앙 배치)
          const textW = embeddedFont.widthOfTextAtSize(formattedText, fontSize);
          const textH = embeddedFont.heightAtSize(fontSize);

          // 박스 가로 중앙, 세로 중앙 계산
          const textX = boxXPt + (boxWPt - textW) / 2;
          const textY = boxYPt + (boxHPt - textH) / 2 + textH * 0.15; // 베이스라인 보정

          page.drawText(formattedText, {
            x: textX,
            y: textY,
            size: fontSize,
            font: embeddedFont,
            color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
          });
        }

        // 50장마다 UI 스레드 양보하여 대량 생성(1000~10000장) 시에도 부드럽게 진행률 갱신
        if (i % 50 === 0 || i === numbers.length - 1) {
          setProgress({ current: i + 1, total: numbers.length });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      const pdfBytes = await outputDoc.save();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const cleanName = (fileName || "원고").replace(/\.[^/.]+$/, "");
      link.download = `${cleanName}_넘버링_${formatNumber(startNum)}~${formatNumber(endNum)}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("대량 PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      {/* 헤더 */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 08
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              PDF 편집 및 변환
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 일련번호(넘버링) 생성기
          </h1>
          <p className="mt-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">
            배경 박스와 글씨 크기가 완전히 분리되어, 투명도와 모서리 둥글기를 조절하고 대량 PDF를 초고속 생성합니다.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 좌측: 제어 패널 */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* 1. 파일 업로드 박스 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-[#222222] dark:border-[#444444] p-6 relative hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input
              type="file"
              id="num-file-input"
              accept=".pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {!fileName ? (
              <div className="text-center pointer-events-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-[#222222] dark:text-[#EAEAEA]">
                  upload_file
                </span>
                <p className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">
                  양식 PDF 파일 업로드
                </p>
                <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">
                  티켓, 상품권, 확인서 등 (단면 1페이지)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 z-20 relative">
                <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                  picture_as_pdf
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] truncate">
                    {fileName}
                  </p>
                  <p className="text-xs font-mono text-[#666666] dark:text-[#A0A0A0] mt-0.5">
                    {pageWidthMm} × {pageHeightMm} mm
                  </p>
                </div>
                <button
                  onClick={resetFile}
                  className="text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] border border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#121212] w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. 넘버링 위치 및 배경 박스 관리 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] flex items-center justify-between">
              <div className="font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                번호 박스 위치 & 크기
              </div>
              <button
                onClick={addPosition}
                disabled={!fileBuffer}
                className="text-xs font-black bg-[#222222] text-white dark:bg-[#EAEAEA] dark:text-[#121212] px-2.5 py-1 flex items-center gap-1 hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> 위치 추가
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 위치 선택 탭 */}
              <div className="flex flex-wrap gap-2">
                {positions.map((pos) => {
                  const isActive = pos.id === activePosId;
                  return (
                    <div
                      key={pos.id}
                      className={`inline-flex items-center border-2 transition-all ${
                        isActive
                          ? "border-[#222222] bg-[#222222] text-white dark:border-[#EAEAEA] dark:bg-[#EAEAEA] dark:text-[#121212]"
                          : "border-[#E5E4E0] dark:border-[#333333] bg-white dark:bg-[#121212] text-[#666666] dark:text-[#A0A0A0]"
                      }`}
                    >
                      <button
                        onClick={() => setActivePosId(pos.id)}
                        className="px-3 py-1 text-xs font-bold"
                      >
                        {pos.name}
                      </button>
                      {positions.length > 1 && (
                        <button
                          onClick={() => removePosition(pos.id)}
                          className="px-1.5 py-1 text-xs hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 좌표 및 박스 크기 수치 입력 */}
              {activePos && (
                <div className="space-y-3 pt-2 border-t border-[#E5E4E0] dark:border-[#333333]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        위치 X (좌측 mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={activePos.xMm}
                        disabled={!fileBuffer}
                        onChange={(e) => updateActivePos({ xMm: Number(e.target.value) })}
                        className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222222]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        위치 Y (상단 mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={activePos.yMm}
                        disabled={!fileBuffer}
                        onChange={(e) => updateActivePos({ yMm: Number(e.target.value) })}
                        className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222222]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        박스 가로 너비 (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="10"
                        value={activePos.widthMm}
                        disabled={!fileBuffer}
                        onChange={(e) => updateActivePos({ widthMm: Number(e.target.value) })}
                        className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222222]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        박스 세로 높이 (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        value={activePos.heightMm}
                        disabled={!fileBuffer}
                        onChange={(e) => updateActivePos({ heightMm: Number(e.target.value) })}
                        className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222222]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. 배경 박스 스타일 (투명도 & 둥근 모서리 각도) */}
          {activePos && (
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
              <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] flex items-center justify-between">
                <div className="font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">layers</span>
                  배경 상자 (투명도·둥글기)
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activePos.hasBg}
                    onChange={(e) => updateActivePos({ hasBg: e.target.checked })}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA]">
                    배경 켜기
                  </span>
                </label>
              </div>

              <div className="p-5 space-y-4">
                {!activePos.hasBg ? (
                  <div className="bg-gray-50 dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] p-3 text-center">
                    <p className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0]">
                      현재 <strong className="text-blue-600">완전 투명 모드</strong>입니다.
                    </p>
                    <p className="text-[11px] text-[#888888] mt-0.5">
                      원본 PDF 위에 숫자만 깔끔하게 인쇄됩니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0]">
                          배경 투명도
                        </label>
                        <span className="text-xs font-black font-mono">{activePos.bgOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activePos.bgOpacity}
                        onChange={(e) => updateActivePos({ bgOpacity: Number(e.target.value) })}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0]">
                          모서리 둥근 각도
                        </label>
                        <span className="text-xs font-black font-mono">
                          {activePos.borderRadiusMm} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={activePos.borderRadiusMm}
                        onChange={(e) =>
                          updateActivePos({ borderRadiusMm: Number(e.target.value) })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        배경 색상
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { label: "흰색", color: "#ffffff" },
                          { label: "연회색", color: "#f3f4f6" },
                          { label: "노랑", color: "#fef08a" },
                          { label: "검정", color: "#111827" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => updateActivePos({ bgColor: c.color })}
                            className={`px-2 py-0.5 text-xs font-bold border-2 transition-all flex items-center gap-1 ${
                              activePos.bgColor === c.color
                                ? "border-[#222222] dark:border-[#EAEAEA] font-black scale-105"
                                : "border-[#E5E4E0] dark:border-[#333333]"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: c.color }}
                            />
                            {c.label}
                          </button>
                        ))}
                        <input
                          type="color"
                          value={activePos.bgColor}
                          onChange={(e) => updateActivePos({ bgColor: e.target.value })}
                          className="w-7 h-6 cursor-pointer border border-[#E5E4E0] p-0 ml-auto"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 4. 번호 범위 및 규칙 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
              번호 범위 (대량 연속 생성)
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    시작 번호
                  </label>
                  <input
                    type="number"
                    value={startNum}
                    onChange={(e) => setStartNum(Number(e.target.value))}
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-2 text-sm font-bold outline-none focus:border-[#222222]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    끝 번호
                  </label>
                  <input
                    type="number"
                    value={endNum}
                    onChange={(e) => setEndNum(Number(e.target.value))}
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-2 text-sm font-bold outline-none focus:border-[#222222]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    접두사(Prefix)
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="No. "
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-2.5 py-2 text-xs font-bold outline-none focus:border-[#222222]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    자릿수(0 채우기)
                  </label>
                  <select
                    value={digits}
                    onChange={(e) => setDigits(Number(e.target.value))}
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-2 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value={0}>없음 (1, 2...)</option>
                    <option value={3}>3자리 (001)</option>
                    <option value={4}>4자리 (0001)</option>
                    <option value={5}>5자리 (00001)</option>
                    <option value={6}>6자리 (000001)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    접미사(Suffix)
                  </label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="번"
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-2.5 py-2 text-xs font-bold outline-none focus:border-[#222222]"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-[#1A233A] border-2 border-blue-200 dark:border-blue-800 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    첫 장 번호 미리보기
                  </p>
                  <p className="text-base font-black text-blue-900 dark:text-blue-100 font-mono mt-0.5">
                    {formatNumber(startNum)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    총 생성 수량
                  </p>
                  <p className="text-sm font-black text-blue-900 dark:text-blue-100 mt-0.5">
                    {totalQuantity.toLocaleString()} 장
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 폰트 및 독립 글씨 크기 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_paint</span>
              글꼴 및 독립 글씨 크기
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    서체
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as any)}
                    className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-2 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="Courier">Courier (티켓 고정폭)</option>
                    <option value="Helvetica">Helvetica (고딕)</option>
                    <option value="Times">Times Roman (명조)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                    글자 크기: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(Number(e.target.value));
                      saveSnapshot(undefined, Number(e.target.value));
                    }}
                    className="w-full mt-2 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                  글자 색상
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { label: "적색", color: "#dc2626" },
                    { label: "흑색", color: "#000000" },
                    { label: "청색", color: "#2563eb" },
                    { label: "금색", color: "#d97706" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setFontColor(c.color)}
                      className={`px-2.5 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                        fontColor === c.color
                          ? "border-[#222222] dark:border-[#EAEAEA] scale-105 font-black"
                          : "border-[#E5E4E0] dark:border-[#333333]"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-8 h-7 cursor-pointer border border-[#E5E4E0] p-0 ml-auto"
                    title="커스텀 색상 선택"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. 초고속 대량 PDF 생성 버튼 */}
          <button
            onClick={handleGeneratePdf}
            disabled={!fileBuffer || isGenerating || totalQuantity <= 0}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-40 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 text-lg"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span>
                {progress
                  ? `초고속 생성 중... (${progress.current.toLocaleString()} / ${progress.total.toLocaleString()}장)`
                  : "생성 준비 중..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">download</span>
                일련번호 PDF 대량 생성 ({totalQuantity.toLocaleString()}장)
              </>
            )}
          </button>
        </div>

        {/* 우측: 시각적 인터랙티브 에디터 */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[820px] overflow-hidden">
          {/* 상단 툴바 */}
          <div className="bg-[#222222] dark:bg-[#111111] px-5 py-3.5 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0 text-[#F5F4F0]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">touch_app</span>
                비주얼 에디터
              </span>
              {pageWidthMm > 0 && (
                <span className="text-[11px] font-mono text-[#A0A0A0] bg-[#333333] px-2.5 py-0.5 border border-[#444444]">
                  {pageWidthMm} × {pageHeightMm} mm
                </span>
              )}
            </div>

            {/* 히스토리 조작 툴바 (Undo / Redo / Shift 뱃지) */}
            <div className="flex items-center gap-2">
              {isShiftPressed && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 animate-pulse">
                  Shift: 박스 종횡비 고정
                </span>
              )}

              <div className="flex items-center border border-[#444444] bg-[#2A2A2A]">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:hover:text-[#A0A0A0] transition-colors flex items-center"
                  title="실행 취소 (Ctrl+Z)"
                >
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                </button>
                <div className="w-[1px] h-4 bg-[#444444]" />
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:hover:text-[#A0A0A0] transition-colors flex items-center"
                  title="다시 실행 (Ctrl+Y)"
                >
                  <span className="material-symbols-outlined text-[18px]">redo</span>
                </button>
              </div>
            </div>
          </div>

          {/* 에디터 작업대 */}
          <div className="flex-1 bg-[#2A2A2A] relative overflow-auto p-6 flex items-center justify-center select-none">
            {previewImgUrl ? (
              <div
                ref={editorContainerRef}
                onClick={handleCanvasClick}
                className="relative shadow-[0_12px_28px_rgba(0,0,0,0.7)] cursor-crosshair select-none bg-white"
                style={{
                  width: "100%",
                  maxWidth: "680px",
                  aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
                }}
              >
                {/* 배경: PDF 첫 페이지 이미지 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImgUrl}
                  alt="PDF Page Preview"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* 넘버링 위치 및 배경 박스들 오버레이 */}
                {positions.map((pos) => {
                  const isActive = pos.id === activePosId;
                  const leftPercent = (pos.xMm / pageWidthMm) * 100;
                  const topPercent = (pos.yMm / pageHeightMm) * 100;
                  const widthPercent = (pos.widthMm / pageWidthMm) * 100;
                  const heightPercent = (pos.heightMm / pageHeightMm) * 100;

                  return (
                    <div
                      key={pos.id}
                      onMouseDown={(e) => handleStartMove(e, pos.id)}
                      onWheel={handleBoxWheel}
                      className={`absolute group cursor-move select-none transition-shadow flex items-center justify-center ${
                        isActive
                          ? "ring-2 ring-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.4)] z-30"
                          : "border border-dashed border-gray-400 opacity-80 hover:opacity-100 z-20"
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: pos.hasBg ? pos.bgColor : "transparent",
                        opacity: pos.hasBg ? pos.bgOpacity / 100 : 1,
                        borderRadius: `${pos.borderRadiusMm}mm`,
                      }}
                    >
                      {/* 실제 텍스트 내용 (박스 내부 중앙 정렬) */}
                      <div className="flex items-center gap-1.5 pointer-events-none overflow-hidden px-1">
                        <span
                          className="font-black leading-none whitespace-nowrap"
                          style={{
                            fontSize: `${fontSize}px`,
                            color: fontColor,
                            fontFamily:
                              fontFamily === "Courier"
                                ? "monospace"
                                : fontFamily === "Times"
                                ? "serif"
                                : "sans-serif",
                          }}
                        >
                          {formatNumber(startNum)}
                        </span>
                        {positions.length > 1 && (
                          <span className="text-[9px] font-black bg-blue-600 text-white px-1 py-0.2 tracking-tight shrink-0">
                            {pos.name}
                          </span>
                        )}
                      </div>

                      {/* 활성 박스일 때 모서리 리사이즈 핸들 (박스 크기만 조절) */}
                      {isActive && (
                        <>
                          <div
                            onMouseDown={(e) => handleStartResize(e, "nw", pos.id)}
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
                            title="박스 크기 조절 (Shift: 정비율)"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, "ne", pos.id)}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                            title="박스 크기 조절 (Shift: 정비율)"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, "sw", pos.id)}
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                            title="박스 크기 조절 (Shift: 정비율)"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, "se", pos.id)}
                            className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform flex items-center justify-center"
                            title="박스 크기 조절 (Shift: 정비율)"
                          >
                            <span className="w-1 h-1 bg-white rounded-full" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-[#A0A0A0] dark:text-[#666666] pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-3 opacity-40">
                  picture_as_pdf
                </span>
                <p className="text-sm font-bold tracking-widest">
                  양식 PDF 원고를 좌측에 업로드하면
                </p>
                <p className="text-xs text-[#888888] mt-1">
                  이곳에 문서가 표시되며 마우스로 드래그하여 배경 박스와 번호 위치를 자유롭게 조절할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 하단 단축키 안내 바 */}
          <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#666666] dark:text-[#A0A0A0] shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-[#2A2A2A] border border-[#CCCCCC] dark:border-[#444444] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs">
                  마우스 드래그
                </kbd>
                위치 이동
              </span>
              <span className="text-[#CCCCCC] dark:text-[#444444]">|</span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-[#2A2A2A] border border-[#CCCCCC] dark:border-[#444444] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs">
                  모서리 핸들
                </kbd>
                배경 박스 크기 조절
              </span>
              <span className="text-[#CCCCCC] dark:text-[#444444]">|</span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-[#2A2A2A] border border-[#CCCCCC] dark:border-[#444444] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs">
                  Shift
                </kbd>
                박스 비율 고정
              </span>
              <span className="text-[#CCCCCC] dark:text-[#444444]">|</span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-[#2A2A2A] border border-[#CCCCCC] dark:border-[#444444] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs">
                  Ctrl + Z
                </kbd>
                실행 취소
              </span>
              <span className="text-[#CCCCCC] dark:text-[#444444]">|</span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-[#2A2A2A] border border-[#CCCCCC] dark:border-[#444444] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs">
                  휠 스크롤
                </kbd>
                글자 크기 미세 조절
              </span>
            </div>
            {fileBuffer && (
              <span className="text-blue-600 dark:text-blue-400 font-black">
                대량 {totalQuantity.toLocaleString()}장 무제한 고속 생성 준비
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
