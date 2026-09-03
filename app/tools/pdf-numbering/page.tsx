"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  bgOpacity: number;
  borderRadiusMm: number;
}

interface HistorySnapshot {
  positions: NumberPosition[];
  activePosId: string;
  fontSize: number;
}

type ResizeHandle = "nw" | "ne" | "se" | "sw";

export default function PdfNumberingPage() {
  // 모드 전환: "single" (단일 매수 출력) vs "stack" (인쇄 조판 Cut & Stack)
  const [outputMode, setOutputMode] = useState<"single" | "stack">("single");

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
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

  // 폰트 & 스타일 설정
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Courier" | "Times">("Courier");
  const [fontColor, setFontColor] = useState<string>("#dc2626");

  // 넘버링 위치 목록
  const [positions, setPositions] = useState<NumberPosition[]>([
    {
      id: "pos-1",
      name: "번호 1",
      xMm: 15,
      yMm: 15,
      widthMm: 28,
      heightMm: 9,
      hasBg: false,
      bgColor: "#ffffff",
      bgOpacity: 80,
      borderRadiusMm: 2,
    },
  ]);
  const [activePosId, setActivePosId] = useState<string>("pos-1");

  // 조판 (Cut & Stack) 전용 설정
  const [sheetPaper, setSheetPaper] = useState<"A4" | "A3">("A4");
  const [cropMarks, setCropMarks] = useState<boolean>(true);
  const [previewSheetIdx, setPreviewSheetIdx] = useState<number>(0);

  // 히스토리 (Ctrl+Z 실행 취소 / Ctrl+Y 다시 실행)
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // 에디터 마우스 인터랙션 상태
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidthPx, setContainerWidthPx] = useState<number>(600);
  const [interactionMode, setInteractionMode] = useState<"idle" | "move" | "resize">("idle");
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const isDraggingFlag = useRef<boolean>(false);

  const dragStartInfo = useRef<{
    startX: number;
    startY: number;
    initialPos: NumberPosition;
  } | null>(null);

  // 생성 진행 상태
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const totalQuantity = Math.max(0, Math.floor((endNum - startNum) / (step || 1)) + 1);

  // --- 조판 (Cut & Stack) 규격 및 그리드 자동 연산 ---
  const sheetDimensions = useMemo(() => {
    if (sheetPaper === "A4") return { wMm: 210, hMm: 297 };
    return { wMm: 297, hMm: 420 };
  }, [sheetPaper]);

  const impositionConfig = useMemo(() => {
    if (!pageWidthMm || !pageHeightMm) return { cols: 2, rows: 5, slotsPerSheet: 10, totalSheets: 100 };
    
    // 용지 안에 최대로 안착할 수 있는 열과 행 계산
    const cols = Math.max(1, Math.floor(sheetDimensions.wMm / pageWidthMm));
    const rows = Math.max(1, Math.floor(sheetDimensions.hMm / pageHeightMm));
    const slotsPerSheet = cols * rows;
    const totalSheets = Math.ceil(totalQuantity / slotsPerSheet);

    return { cols, rows, slotsPerSheet, totalSheets };
  }, [pageWidthMm, pageHeightMm, sheetDimensions, totalQuantity]);

  // 화면 컨테이너 폭 실시간 측정
  useEffect(() => {
    if (!editorContainerRef.current) return;
    const updateWidth = () => {
      if (editorContainerRef.current) {
        setContainerWidthPx(editorContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(editorContainerRef.current);
    return () => ro.disconnect();
  }, [previewImgUrl]);

  const screenScale = pageWidthPt > 0 ? containerWidthPx / pageWidthPt : 1;

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

  // --- 히스토리 스택 관리 ---
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

  // PDF 업로드 및 CMap 폰트 연동
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

        const pdf = await pdfjsLib.getDocument({
          data: buffer.slice(0),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        }).promise;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
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
            xMm: Math.max(5, Math.round(widthMm * 0.65)),
            yMm: Math.max(5, Math.round(heightMm * 0.6)),
            widthMm: Math.min(widthMm * 0.35, 25),
            heightMm: Math.min(heightMm * 0.25, 8),
            hasBg: false,
            bgColor: "#ffffff",
            bgOpacity: 85,
            borderRadiusMm: 2,
          },
        ];
        setPositions(initialPositions);
        setActivePosId("pos-1");
        setPreviewSheetIdx(0);

        setHistory([{ positions: initialPositions, activePosId: "pos-1", fontSize: 14 }]);
        setHistoryIndex(0);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render({ canvasContext: ctx, viewport } as any)).promise;
          setPreviewImgUrl(canvas.toDataURL("image/jpeg", 0.95));
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
    setPageWidthMm(0);
    setPageHeightMm(0);
    setPreviewImgUrl(null);
    setProgress(null);
    setHistory([]);
    setHistoryIndex(-1);
    setPreviewSheetIdx(0);
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
      xMm: Math.min(pageWidthMm - 35, 15 + positions.length * 10),
      yMm: Math.min(pageHeightMm - 20, 15 + positions.length * 10),
      widthMm: activePos ? activePos.widthMm : 25,
      heightMm: activePos ? activePos.heightMm : 8,
      hasBg: activePos ? activePos.hasBg : false,
      bgColor: activePos ? activePos.bgColor : "#ffffff",
      bgOpacity: activePos ? activePos.bgOpacity : 85,
      borderRadiusMm: activePos ? activePos.borderRadiusMm : 2,
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

  // --- 마우스 인터랙션 ---
  const handleStartMove = (e: React.MouseEvent, posId: string) => {
    e.stopPropagation();
    e.preventDefault();
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
    e.preventDefault();
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

      const deltaScreenX = e.clientX - dragStartInfo.current.startX;
      const deltaScreenY = e.clientY - dragStartInfo.current.startY;

      if (Math.abs(deltaScreenX) > 2 || Math.abs(deltaScreenY) > 2) {
        isDraggingFlag.current = true;
      }

      const rect = editorContainerRef.current.getBoundingClientRect();
      const deltaXMm = (deltaScreenX / rect.width) * pageWidthMm;
      const deltaYMm = (deltaScreenY / rect.height) * pageHeightMm;
      const init = dragStartInfo.current.initialPos;

      if (interactionMode === "move") {
        const maxX = Math.max(0, pageWidthMm - init.widthMm);
        const maxY = Math.max(0, pageHeightMm - init.heightMm);
        const newX = Math.max(0, Math.min(maxX, init.xMm + deltaXMm));
        const newY = Math.max(0, Math.min(maxY, init.yMm + deltaYMm));

        setPositions((prev) =>
          prev.map((p) =>
            p.id === init.id
              ? { ...p, xMm: Math.round(newX * 10) / 10, yMm: Math.round(newY * 10) / 10 }
              : p
          )
        );
      } else if (interactionMode === "resize") {
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

        if (e.shiftKey) {
          const ratio = init.widthMm / (init.heightMm || 1);
          const maxDelta = Math.max(Math.abs(deltaXMm), Math.abs(deltaYMm));
          const sign = deltaXMm >= 0 || deltaYMm >= 0 ? 1 : -1;
          newWidth = Math.max(10, init.widthMm + sign * maxDelta);
          newHeight = Math.max(4, newWidth / ratio);
        }

        newWidth = Math.max(10, Math.min(pageWidthMm - init.xMm, Math.round(newWidth * 10) / 10));
        newHeight = Math.max(4, Math.min(pageHeightMm - init.yMm, Math.round(newHeight * 10) / 10));

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

        setTimeout(() => {
          isDraggingFlag.current = false;
        }, 80);
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

  const handleBoxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 1 : -1;
    setFontSize((prev) => Math.max(6, Math.min(72, prev + delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingFlag.current) return;
    if (!activePos || !editorContainerRef.current || !pageWidthMm || !pageHeightMm) return;

    const rect = editorContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetXMm = (clickX / rect.width) * pageWidthMm - activePos.widthMm / 2;
    const targetYMm = (clickY / rect.height) * pageHeightMm - activePos.heightMm / 2;

    const maxX = Math.max(0, pageWidthMm - activePos.widthMm);
    const maxY = Math.max(0, pageHeightMm - activePos.heightMm);
    const newXMm = Math.max(0, Math.min(maxX, Math.round(targetXMm * 10) / 10));
    const newYMm = Math.max(0, Math.min(maxY, Math.round(targetYMm * 10) / 10));

    updateActivePos({ xMm: newXMm, yMm: newYMm });
  };

  // --- PDF 생성 및 다운로드 (단일 매수 출력 or Cut & Stack 인쇄 조판) ---
  const handleGeneratePdf = async () => {
    if (!fileBuffer || totalQuantity <= 0) return;

    setIsGenerating(true);
    const targetTotal = outputMode === "single" ? totalQuantity : impositionConfig.totalSheets;
    setProgress({ current: 0, total: targetTotal });

    try {
      await new Promise((r) => setTimeout(r, 40));

      const srcDoc = await PDFDocument.load(fileBuffer);
      const outputDoc = await PDFDocument.create();

      const srcPage = srcDoc.getPages()[0];
      const { width: itemPtW, height: itemPtH } = srcPage.getSize();
      const [embeddedTemplate] = await outputDoc.embedPages([srcPage]);

      let embeddedFont = await outputDoc.embedFont(StandardFonts.CourierBold);
      if (fontFamily === "Helvetica") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.HelveticaBold);
      } else if (fontFamily === "Times") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.TimesRomanBold);
      }

      const fontRgb = hexToRgb(fontColor);
      const MM_TO_PT = 2.83465;

      if (outputMode === "single") {
        // [단일 매수 출력]: 1장씩 낱장 PDF 생성
        const numbers: number[] = [];
        for (let n = startNum; n <= endNum; n += step) {
          numbers.push(n);
        }

        for (let i = 0; i < numbers.length; i++) {
          const currentNum = numbers[i];
          const formattedText = formatNumber(currentNum);

          const page = outputDoc.addPage([itemPtW, itemPtH]);
          page.drawPage(embeddedTemplate, { x: 0, y: 0, width: itemPtW, height: itemPtH });

          for (const pos of positions) {
            const boxXPt = (pos.xMm / pageWidthMm) * itemPtW;
            const boxYFromTopPt = (pos.yMm / pageHeightMm) * itemPtH;
            const boxWPt = (pos.widthMm / pageWidthMm) * itemPtW;
            const boxHPt = (pos.heightMm / pageHeightMm) * itemPtH;
            const boxYPt = itemPtH - boxYFromTopPt - boxHPt;

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

            const textW = embeddedFont.widthOfTextAtSize(formattedText, fontSize);
            const textH = embeddedFont.heightAtSize(fontSize);
            const textX = boxXPt + (boxWPt - textW) / 2;
            const textY = boxYPt + (boxHPt / 2) - (textH * 0.33);

            page.drawText(formattedText, {
              x: textX,
              y: textY,
              size: fontSize,
              font: embeddedFont,
              color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
            });
          }

          if (i % 50 === 0 || i === numbers.length - 1) {
            setProgress({ current: i + 1, total: numbers.length });
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      } else {
        // [인쇄 조판 (Cut & Stack)]: A4/A3 전지에 10장씩 안착 및 겹침 재단 순서 자동 연산
        const sheetPtW = sheetDimensions.wMm * MM_TO_PT;
        const sheetPtH = sheetDimensions.hMm * MM_TO_PT;
        const { cols, rows, totalSheets } = impositionConfig;

        // 용지 중앙 정렬 여백
        const totalGridWPt = cols * itemPtW;
        const totalGridHPt = rows * itemPtH;
        const offsetPtX = (sheetPtW - totalGridWPt) / 2;
        const offsetPtY = (sheetPtH - totalGridHPt) / 2;

        const markColor = rgb(0.2, 0.2, 0.2);

        for (let s = 0; s < totalSheets; s++) {
          const page = outputDoc.addPage([sheetPtW, sheetPtH]);

          for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
              // Cut & Stack 공식: 1번째 열 아래로 0~4번 슬롯, 2번째 열 아래로 5~9번 슬롯
              const slotIdx = c * rows + r;
              const slotNum = startNum + (slotIdx * totalSheets) + (s * step);

              // 슬롯의 전지 상 위치 (상단 기준)
              const slotXPt = offsetPtX + c * itemPtW;
              const slotYPt = sheetPtH - offsetPtY - (r + 1) * itemPtH;

              // 원본 템플릿 드로우
              page.drawPage(embeddedTemplate, {
                x: slotXPt,
                y: slotYPt,
                width: itemPtW,
                height: itemPtH,
              });

              // 끝 번호를 넘지 않는 경우에만 번호 인쇄
              if (slotNum <= endNum) {
                const formattedText = formatNumber(slotNum);

                for (const pos of positions) {
                  const boxXPt = slotXPt + (pos.xMm / pageWidthMm) * itemPtW;
                  const boxYFromTopPt = (pos.yMm / pageHeightMm) * itemPtH;
                  const boxWPt = (pos.widthMm / pageWidthMm) * itemPtW;
                  const boxHPt = (pos.heightMm / pageHeightMm) * itemPtH;
                  const boxYPt = (slotYPt + itemPtH) - boxYFromTopPt - boxHPt;

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

                  const textW = embeddedFont.widthOfTextAtSize(formattedText, fontSize);
                  const textH = embeddedFont.heightAtSize(fontSize);
                  const textX = boxXPt + (boxWPt - textW) / 2;
                  const textY = boxYPt + (boxHPt / 2) - (textH * 0.33);

                  page.drawText(formattedText, {
                    x: textX,
                    y: textY,
                    size: fontSize,
                    font: embeddedFont,
                    color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
                  });
                }
              }
            }
          }

          // 재단선(Crop Marks) 드로우
          if (cropMarks) {
            const markLen = 5 * MM_TO_PT;
            const drawL = (x1: number, y1: number, x2: number, y2: number) =>
              page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.4, color: markColor });

            // 수직선 재단표시 (상단 / 하단)
            for (let c = 0; c <= cols; c++) {
              const cx = offsetPtX + c * itemPtW;
              drawL(cx, sheetPtH - offsetPtY, cx, sheetPtH - offsetPtY + markLen);
              drawL(cx, offsetPtY, cx, offsetPtY - markLen);
            }
            // 수평선 재단표시 (좌측 / 우측)
            for (let r = 0; r <= rows; r++) {
              const cy = sheetPtH - offsetPtY - r * itemPtH;
              drawL(offsetPtX, cy, offsetPtX - markLen, cy);
              drawL(offsetPtX + totalGridWPt, cy, offsetPtX + totalGridWPt + markLen, cy);
            }
          }

          if (s % 10 === 0 || s === totalSheets - 1) {
            setProgress({ current: s + 1, total: totalSheets });
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      }

      const pdfBytes = await outputDoc.save();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const cleanName = (fileName || "원고").replace(/\.[^/.]+$/, "");
      const modeSuffix = outputMode === "single" ? `_단일_${formatNumber(startNum)}~${formatNumber(endNum)}` : `_조판_Cut&Stack_${sheetPaper}_${impositionConfig.totalSheets}장`;
      link.download = `${cleanName}${modeSuffix}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다.");
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
              PDF 편집 및 조판
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 일련번호 & 조판 (Cut & Stack)
          </h1>
          <p className="mt-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">
            마우스로 번호 위치를 잡고, 재단 후 손으로 분류할 필요 없이 바로 포개지는 인쇄용 하리꼬미를 생성합니다.
          </p>
        </div>

        {/* 상단 모드 전환 탭 */}
        <div className="flex border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] overflow-hidden">
          <button
            onClick={() => setOutputMode("single")}
            className={`px-5 py-2.5 font-bold text-sm border-r-2 border-[#222222] dark:border-[#444444] transition-colors flex items-center gap-2 ${
              outputMode === "single"
                ? "bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]"
                : "text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
            단일 매수 출력
          </button>
          <button
            onClick={() => setOutputMode("stack")}
            className={`px-5 py-2.5 font-bold text-sm transition-colors flex items-center gap-2 ${
              outputMode === "stack"
                ? "bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]"
                : "text-[#666666] dark:text-[#A0A0A0] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">layers</span>
            인쇄 조판 (Cut & Stack)
            <span className="bg-red-500 text-white text-[10px] px-1 py-0.2 rounded-xs font-black">추천</span>
          </button>
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
                  티켓, 상품권, 쿠폰 등 (단면 1페이지)
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

          {/* Cut & Stack 조판 모드일 때 전용 인쇄 설정 카드 */}
          {outputMode === "stack" && (
            <div className="bg-blue-50 dark:bg-[#1A233A] border-2 border-blue-300 dark:border-blue-700 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
              <div className="bg-blue-100 dark:bg-[#202E4E] px-5 py-3 border-b-2 border-blue-300 dark:border-blue-700 flex items-center justify-between">
                <div className="font-black text-blue-950 dark:text-blue-100 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">content_cut</span>
                  재단 적층 (Cut & Stack) 설정
                </div>
                <span className="text-[11px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5">
                  1판 {impositionConfig.slotsPerSheet}개 안착
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200 mb-1">
                      인쇄 용지 규격
                    </label>
                    <select
                      value={sheetPaper}
                      onChange={(e) => setSheetPaper(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#121212] border-2 border-blue-200 dark:border-blue-700 px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="A3">A3 (297 × 420 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200 mb-1">
                      재단선 표시 (Crop Mark)
                    </label>
                    <button
                      onClick={() => setCropMarks(!cropMarks)}
                      className={`w-full py-2 text-xs font-bold border-2 transition-colors flex items-center justify-center gap-1.5 ${
                        cropMarks
                          ? "bg-blue-600 text-white border-blue-700 font-black"
                          : "bg-white text-gray-500 border-blue-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {cropMarks ? "check_circle" : "cancel"}
                      </span>
                      {cropMarks ? "재단선 ON" : "재단선 OFF"}
                    </button>
                  </div>
                </div>

                {/* 적층 원리 안내 다이어그램 */}
                <div className="border border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-[#121212]/80 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-blue-950 dark:text-blue-100">
                    <span>1번째 인쇄 장 배열 예시</span>
                    <span className="text-blue-600 font-mono">
                      총 {impositionConfig.totalSheets}장 출력
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-center font-bold">
                    <div className="bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-blue-700 py-1">
                      1번 (좌상)
                    </div>
                    <div className="bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-blue-700 py-1">
                      {1 + impositionConfig.rows * impositionConfig.totalSheets}번 (우상)
                    </div>
                    <div className="bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-blue-700 py-1">
                      {1 + 1 * impositionConfig.totalSheets}번
                    </div>
                    <div className="bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-blue-700 py-1">
                      {1 + (impositionConfig.rows + 1) * impositionConfig.totalSheets}번
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 font-bold leading-tight pt-1">
                    ✓ 출력된 {impositionConfig.totalSheets}장을 그대로 겹쳐서 재단하면, 수작업 분류 없이 1번부터 {endNum}번까지 순서대로 바로 포개집니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. 번호 박스 위치 & 크기 관리 */}
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
                        박스 너비 (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        value={activePos.widthMm}
                        disabled={!fileBuffer}
                        onChange={(e) => updateActivePos({ widthMm: Number(e.target.value) })}
                        className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222222]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                        박스 높이 (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="3"
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

          {/* 3. 배경 박스 스타일 (투명도 & 모서리 둥글기) */}
          {activePos && (
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
              <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] flex items-center justify-between">
                <div className="font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">layers</span>
                  배경 박스 (투명도·둥글기)
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
                      원본 PDF 위에 번호 글씨만 깔끔하게 인쇄됩니다.
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
              번호 범위 및 서식
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
                    {outputMode === "single" ? "총 출력 매수" : "총 필요 전지"}
                  </p>
                  <p className="text-sm font-black text-blue-900 dark:text-blue-100 mt-0.5">
                    {outputMode === "single"
                      ? `${totalQuantity.toLocaleString()} 장`
                      : `${sheetPaper} ${impositionConfig.totalSheets.toLocaleString()} 장`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 폰트 및 독립 글씨 크기 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_paint</span>
              글꼴 및 글씨 크기
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
                    min="6"
                    max="48"
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

          {/* 6. PDF 생성 버튼 */}
          <button
            onClick={handleGeneratePdf}
            disabled={!fileBuffer || isGenerating || totalQuantity <= 0}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-40 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 text-lg"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span>
                {progress
                  ? `생성 중... (${progress.current.toLocaleString()} / ${progress.total.toLocaleString()})`
                  : "생성 준비 중..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">download</span>
                {outputMode === "single"
                  ? `일련번호 PDF 생성 (${totalQuantity.toLocaleString()}장)`
                  : `Cut & Stack 조판 PDF 생성 (${impositionConfig.totalSheets.toLocaleString()}장)`}
              </>
            )}
          </button>
        </div>

        {/* 우측: 시각적 인터랙티브 에디터 및 조판 미리보기 */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[840px] overflow-hidden">
          {/* 상단 툴바 */}
          <div className="bg-[#222222] dark:bg-[#111111] px-5 py-3.5 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0 text-[#F5F4F0]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">
                  {outputMode === "single" ? "touch_app" : "grid_view"}
                </span>
                {outputMode === "single" ? "원고 넘버링 에디터" : "Cut & Stack 조판 시트 미리보기"}
              </span>
              {pageWidthMm > 0 && (
                <span className="text-[11px] font-mono text-[#A0A0A0] bg-[#333333] px-2.5 py-0.5 border border-[#444444]">
                  {outputMode === "single"
                    ? `${pageWidthMm} × ${pageHeightMm} mm`
                    : `${sheetPaper} (${sheetDimensions.wMm}×${sheetDimensions.hMm}mm) • ${impositionConfig.cols}×${impositionConfig.rows} 안착`}
                </span>
              )}
            </div>

            {/* 조판 모드 시트 넘김 네비게이션 */}
            {outputMode === "stack" && fileBuffer && (
              <div className="flex items-center gap-3 bg-[#2A2A2A] px-3 py-1 border border-[#444444]">
                <button
                  onClick={() => setPreviewSheetIdx((prev) => Math.max(0, prev - 1))}
                  disabled={previewSheetIdx === 0}
                  className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                >
                  &lt;
                </button>
                <span className="text-xs font-mono font-bold tracking-widest">
                  Sheet {previewSheetIdx + 1} / {impositionConfig.totalSheets}
                </span>
                <button
                  onClick={() =>
                    setPreviewSheetIdx((prev) => Math.min(impositionConfig.totalSheets - 1, prev + 1))
                  }
                  disabled={previewSheetIdx >= impositionConfig.totalSheets - 1}
                  className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                >
                  &gt;
                </button>
              </div>
            )}

            {/* 단일 모드 히스토리 조작 툴바 */}
            {outputMode === "single" && (
              <div className="flex items-center gap-2">
                {isShiftPressed && (
                  <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5">
                    Shift: 비율 고정
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
            )}
          </div>

          {/* 에디터 작업대 */}
          <div className="flex-1 bg-[#2A2A2A] relative overflow-auto p-6 flex items-center justify-center select-none">
            {previewImgUrl ? (
              outputMode === "single" ? (
                /* [단일 모드]: 원본 위에 마우스로 위치 잡는 인터랙티브 에디터 */
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImgUrl}
                    alt="PDF Page Preview"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {positions.map((pos) => {
                    const isActive = pos.id === activePosId;
                    const leftPercent = (pos.xMm / pageWidthMm) * 100;
                    const topPercent = (pos.yMm / pageHeightMm) * 100;
                    const widthPercent = (pos.widthMm / pageWidthMm) * 100;
                    const heightPercent = (pos.heightMm / pageHeightMm) * 100;
                    const renderedFontSizePx = Math.max(6, fontSize * screenScale);

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
                        <div className="flex items-center justify-center w-full h-full pointer-events-none overflow-hidden px-0.5">
                          <span
                            className="font-black leading-none whitespace-nowrap"
                            style={{
                              fontSize: `${renderedFontSizePx}px`,
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
                        </div>

                        {isActive && (
                          <>
                            <div
                              onMouseDown={(e) => handleStartResize(e, "nw", pos.id)}
                              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
                              title="박스 크기 조절 (Shift: 비율 고정)"
                            />
                            <div
                              onMouseDown={(e) => handleStartResize(e, "ne", pos.id)}
                              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                              title="박스 크기 조절 (Shift: 비율 고정)"
                            />
                            <div
                              onMouseDown={(e) => handleStartResize(e, "sw", pos.id)}
                              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                              title="박스 크기 조절 (Shift: 비율 고정)"
                            />
                            <div
                              onMouseDown={(e) => handleStartResize(e, "se", pos.id)}
                              className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform flex items-center justify-center"
                              title="박스 크기 조절 (Shift: 비율 고정)"
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
                /* [조판 모드]: 전지(A4/A3) 상에 10장씩 앉혀진 Cut & Stack 실시간 렌더링 뷰어 */
                <div
                  className="relative shadow-[0_16px_36px_rgba(0,0,0,0.8)] bg-white border border-gray-400 select-none p-4 flex flex-col items-center justify-center"
                  style={{
                    height: "100%",
                    maxHeight: "720px",
                    aspectRatio: `${sheetDimensions.wMm} / ${sheetDimensions.hMm}`,
                  }}
                >
                  {/* 전지 그리드 컨테이너 */}
                  <div
                    className="w-full h-full relative grid border border-dashed border-gray-400"
                    style={{
                      gridTemplateColumns: `repeat(${impositionConfig.cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${impositionConfig.rows}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: impositionConfig.slotsPerSheet }).map((_, idx) => {
                      const c = Math.floor(idx / impositionConfig.rows);
                      const r = idx % impositionConfig.rows;
                      const slotIdx = c * impositionConfig.rows + r;
                      const slotNum =
                        startNum + slotIdx * impositionConfig.totalSheets + previewSheetIdx * step;
                      const isOver = slotNum > endNum;

                      return (
                        <div
                          key={idx}
                          className="relative border border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewImgUrl}
                            alt="Slot Preview"
                            className="w-full h-full object-contain pointer-events-none"
                          />

                          {/* 슬롯 상의 번호 오버레이 */}
                          {!isOver &&
                            positions.map((pos) => {
                              const leftPercent = (pos.xMm / pageWidthMm) * 100;
                              const topPercent = (pos.yMm / pageHeightMm) * 100;
                              const widthPercent = (pos.widthMm / pageWidthMm) * 100;
                              const heightPercent = (pos.heightMm / pageHeightMm) * 100;

                              return (
                                <div
                                  key={pos.id}
                                  className="absolute flex items-center justify-center"
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
                                  <span
                                    className="font-black leading-none whitespace-nowrap"
                                    style={{
                                      fontSize: `${Math.max(6, fontSize * 0.45)}px`,
                                      color: fontColor,
                                      fontFamily:
                                        fontFamily === "Courier"
                                          ? "monospace"
                                          : fontFamily === "Times"
                                          ? "serif"
                                          : "sans-serif",
                                    }}
                                  >
                                    {formatNumber(slotNum)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center text-[#A0A0A0] dark:text-[#666666] pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-3 opacity-40">
                  picture_as_pdf
                </span>
                <p className="text-sm font-bold tracking-widest">
                  양식 PDF 원고를 좌측에 업로드하면
                </p>
                <p className="text-xs text-[#888888] mt-1">
                  이곳에 문서가 표시되며 번호 위치 지정 및 Cut & Stack 조판 미리보기가 제공됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 하단 안내 바 */}
          <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#666666] dark:text-[#A0A0A0] shrink-0">
            {outputMode === "single" ? (
              <div className="flex flex-wrap items-center gap-3">
                <span>마우스 드래그로 번호 위치 이동</span>
                <span>•</span>
                <span>모서리 핸들로 박스 크기 조절</span>
                <span>•</span>
                <span>Ctrl + Z 실행 취소</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>
                  출력 후 100장을 겹쳐서 재단하면, 1번부터 1,000번까지 손으로 맞출 필요 없이 완벽하게 자동 정렬됩니다.
                </span>
              </div>
            )}
            {fileBuffer && (
              <span className="text-[#222222] dark:text-[#EAEAEA] font-black">
                {outputMode === "single"
                  ? `총 ${totalQuantity.toLocaleString()}장 낱장 출력`
                  : `총 ${impositionConfig.totalSheets.toLocaleString()}장 ${sheetPaper} 인쇄판`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
