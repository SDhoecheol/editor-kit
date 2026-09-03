"use client";

import { useState, useRef, useEffect } from "react";
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
}

export default function PdfNumberingPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageWidthMm, setPageWidthMm] = useState<number>(0);
  const [pageHeightMm, setPageHeightMm] = useState<number>(0);
  const [pageWidthPt, setPageWidthPt] = useState<number>(0);
  const [pageHeightPt, setPageHeightPt] = useState<number>(0);
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  // 번호 설정
  const [startNum, setStartNum] = useState<number>(1);
  const [endNum, setEndNum] = useState<number>(100);
  const [step, setStep] = useState<number>(1);
  const [digits, setDigits] = useState<number>(4); // 0이면 패딩 없음
  const [prefix, setPrefix] = useState<string>("No. ");
  const [suffix, setSuffix] = useState<string>("");

  // 폰트 & 스타일 설정
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Courier" | "Times">("Courier");
  const [fontColor, setFontColor] = useState<string>("#dc2626"); // 티켓 인쇄용 기본 적색
  
  // 넘버링 위치 목록 (다중 넘버링 지원)
  const [positions, setPositions] = useState<NumberPosition[]>([
    { id: "pos-1", name: "번호 1", xMm: 15, yMm: 15 },
  ]);
  const [activePosId, setActivePosId] = useState<string>("pos-1");

  // 드래그 상태 관리
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [draggingPosId, setDraggingPosId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 생성 진행 상태
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // 총 생성 수량 계산
  const totalQuantity = Math.max(0, Math.floor((endNum - startNum) / (step || 1)) + 1);

  // 샘플 번호 포맷팅
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

  // PDF 업로드 및 첫 페이지 렌더링
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
        const viewport = page.getViewport({ scale: 1.5 }); // 선명한 미리보기용 1.5x
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        const widthPt = unscaledViewport.width;
        const heightPt = unscaledViewport.height;
        const widthMm = Math.round((widthPt / 2.83465) * 10) / 10;
        const heightMm = Math.round((heightPt / 2.83465) * 10) / 10;

        setPageWidthPt(widthPt);
        setPageHeightPt(heightPt);
        setPageWidthMm(widthMm);
        setPageHeightMm(heightMm);

        // 기본 위치를 페이지 우측 상단으로 초기화
        setPositions([
          {
            id: "pos-1",
            name: "번호 1",
            xMm: Math.max(10, Math.round(widthMm * 0.75)),
            yMm: 15,
          },
        ]);
        setActivePosId("pos-1");

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
    const fileInput = document.getElementById("num-file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // 활성화된 위치 정보 가져오기
  const activePos = positions.find((p) => p.id === activePosId) || positions[0];

  const updateActivePos = (fields: Partial<NumberPosition>) => {
    if (!activePos) return;
    setPositions((prev) =>
      prev.map((p) => (p.id === activePos.id ? { ...p, ...fields } : p))
    );
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
      xMm: Math.min(pageWidthMm - 20, 20 + positions.length * 15),
      yMm: Math.min(pageHeightMm - 20, 20 + positions.length * 15),
    };
    setPositions((prev) => [...prev, newPos]);
    setActivePosId(newId);
  };

  const removePosition = (id: string) => {
    if (positions.length <= 1) {
      alert("최소 1개의 번호 위치가 필요합니다.");
      return;
    }
    const nextList = positions.filter((p) => p.id !== id);
    setPositions(nextList);
    if (activePosId === id) {
      setActivePosId(nextList[0].id);
    }
  };

  // 에디터 상에서 마우스 드래그로 박스 이동
  const handleMouseDown = (e: React.MouseEvent, posId: string) => {
    e.stopPropagation();
    setActivePosId(posId);
    setDraggingPosId(posId);

    const pos = positions.find((p) => p.id === posId);
    if (!pos || !editorContainerRef.current) return;

    const rect = editorContainerRef.current.getBoundingClientRect();
    const currentPxX = (pos.xMm / pageWidthMm) * rect.width;
    const currentPxY = (pos.yMm / pageHeightMm) * rect.height;

    setDragOffset({
      x: e.clientX - (rect.left + currentPxX),
      y: e.clientY - (rect.top + currentPxY),
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingPosId || !editorContainerRef.current || !pageWidthMm || !pageHeightMm) return;

      const rect = editorContainerRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - dragOffset.x;
      const rawY = e.clientY - rect.top - dragOffset.y;

      // 경계 제한 (0 ~ 100%)
      const clampedX = Math.max(0, Math.min(rawX, rect.width));
      const clampedY = Math.max(0, Math.min(rawY, rect.height));

      const newXMm = Math.round((clampedX / rect.width) * pageWidthMm * 10) / 10;
      const newYMm = Math.round((clampedY / rect.height) * pageHeightMm * 10) / 10;

      setPositions((prev) =>
        prev.map((p) =>
          p.id === draggingPosId ? { ...p, xMm: newXMm, yMm: newYMm } : p
        )
      );
    };

    const handleMouseUp = () => {
      setDraggingPosId(null);
    };

    if (draggingPosId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingPosId, dragOffset, pageWidthMm, pageHeightMm]);

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

  // PDF 생성 엔진
  const handleGeneratePdf = async () => {
    if (!fileBuffer || totalQuantity <= 0) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: totalQuantity });

    try {
      // 렌더링 락 방지를 위한 지연
      await new Promise((r) => setTimeout(r, 50));

      const srcDoc = await PDFDocument.load(fileBuffer);
      const outputDoc = await PDFDocument.create();

      // 폰트 임베딩
      let embeddedFont = await outputDoc.embedFont(StandardFonts.CourierBold);
      if (fontFamily === "Helvetica") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.HelveticaBold);
      } else if (fontFamily === "Times") {
        embeddedFont = await outputDoc.embedFont(StandardFonts.TimesRomanBold);
      }

      const { r, g, b } = hexToRgb(fontColor);

      // 전체 번호 생성 루프
      const numbers: number[] = [];
      for (let n = startNum; n <= endNum; n += step) {
        numbers.push(n);
      }

      const MM_TO_PT = 2.83465;

      for (let i = 0; i < numbers.length; i++) {
        const currentNum = numbers[i];
        const formattedText = formatNumber(currentNum);

        // 원본 첫 페이지 복제하여 새 문서에 추가
        const [copiedPage] = await outputDoc.copyPages(srcDoc, [0]);
        const page = outputDoc.addPage(copiedPage);
        const { height: pageH } = page.getSize();

        // 등록된 모든 번호 위치에 drawText
        for (const pos of positions) {
          const ptX = pos.xMm * MM_TO_PT;
          // PDF 좌표계(좌하단 원점) 변환: 텍스트 상단 기준 위치 맞춤
          const ptY = pageH - (pos.yMm * MM_TO_PT) - (fontSize * 0.85);

          page.drawText(formattedText, {
            x: ptX,
            y: ptY,
            size: fontSize,
            font: embeddedFont,
            color: rgb(r, g, b),
          });
        }

        // 10장마다 프로그레스 업데이트 및 UI 스레드 양보
        if (i % 10 === 0 || i === numbers.length - 1) {
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
              유틸리티 / 07
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄 및 터잡기 (조판)
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            PDF 일련번호(넘버링) 자동 생성
          </h1>
          <p className="mt-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">
            티켓, 상품권, 추첨권, 계약서 등 단일 양식에 지정한 위치마다 일련번호를 매겨 대량 PDF로 출력합니다.
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

          {/* 2. 넘버링 위치 관리 박스 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] flex items-center justify-between">
              <div className="font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                번호 위치 지정
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

              {/* 좌표 수치 직접 입력 */}
              {activePos && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E5E4E0] dark:border-[#333333]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                      X 좌표 (좌측 기준 mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={activePos.xMm}
                      disabled={!fileBuffer}
                      onChange={(e) => updateActivePos({ xMm: Number(e.target.value) })}
                      className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-sm font-bold outline-none focus:border-[#222222] dark:focus:border-[#EAEAEA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] dark:text-[#A0A0A0] mb-1">
                      Y 좌표 (상단 기준 mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={activePos.yMm}
                      disabled={!fileBuffer}
                      onChange={(e) => updateActivePos({ yMm: Number(e.target.value) })}
                      className="w-full bg-[#F5F4F0] dark:bg-[#121212] border-2 border-[#E5E4E0] dark:border-[#333333] px-3 py-1.5 text-sm font-bold outline-none focus:border-[#222222] dark:focus:border-[#EAEAEA]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. 번호 범위 및 규칙 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
              번호 범위 및 규칙
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

              {/* 미리보기 샘플 박스 */}
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
                    총 인쇄 매수
                  </p>
                  <p className="text-sm font-black text-blue-900 dark:text-blue-100 mt-0.5">
                    {totalQuantity} 장
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 폰트 및 스타일 */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-5 py-3 border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_paint</span>
              글꼴 및 색상
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
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
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

          {/* 5. PDF 생성 버튼 */}
          <button
            onClick={handleGeneratePdf}
            disabled={!fileBuffer || isGenerating || totalQuantity <= 0}
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-40 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 text-lg"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span>
                {progress
                  ? `생성 중... (${progress.current}/${progress.total})`
                  : "생성 준비 중..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">download</span>
                일련번호 PDF 생성 및 다운로드 ({totalQuantity}장)
              </>
            )}
          </button>
        </div>

        {/* 우측: 시각적 인터랙티브 에디터 */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[780px] overflow-hidden">
          {/* 상단 툴바 */}
          <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0 text-[#F5F4F0]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">touch_app</span>
                인터랙티브 위치 에디터
              </span>
              {pageWidthMm > 0 && (
                <span className="text-[11px] font-mono text-[#A0A0A0] bg-[#333333] px-2.5 py-0.5 border border-[#444444]">
                  {pageWidthMm} × {pageHeightMm} mm
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#A0A0A0] hidden sm:block">
              마우스로 번호 박스를 끌어서 원하는 위치에 놓으세요
            </p>
          </div>

          {/* 에디터 작업대 */}
          <div className="flex-1 bg-[#2A2A2A] relative overflow-auto p-6 flex items-center justify-center">
            {previewImgUrl ? (
              <div
                ref={editorContainerRef}
                onClick={handleCanvasClick}
                className="relative shadow-[0_12px_24px_rgba(0,0,0,0.6)] cursor-crosshair select-none bg-white"
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

                {/* 넘버링 위치 박스들 오버레이 */}
                {positions.map((pos) => {
                  const isActive = pos.id === activePosId;
                  const leftPercent = (pos.xMm / pageWidthMm) * 100;
                  const topPercent = (pos.yMm / pageHeightMm) * 100;

                  return (
                    <div
                      key={pos.id}
                      onMouseDown={(e) => handleMouseDown(e, pos.id)}
                      className={`absolute cursor-grab active:cursor-grabbing transform -translate-x-0 -translate-y-0 px-2 py-0.5 border-2 transition-shadow whitespace-nowrap select-none ${
                        isActive
                          ? "border-blue-600 bg-white/95 shadow-[0_0_0_3px_rgba(37,99,235,0.3)] z-30"
                          : "border-gray-500 bg-white/80 opacity-80 hover:opacity-100 z-20"
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-bold leading-none select-none"
                          style={{
                            fontSize: `${Math.max(10, fontSize * 0.9)}px`,
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
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1 py-0.2 rounded-xs">
                          {pos.name}
                        </span>
                      </div>
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
                  이곳에 문서가 표시되며 마우스로 일련번호 위치를 지정할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 하단 안내 바 */}
          <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#666666] dark:text-[#A0A0A0] shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#222222] dark:text-[#EAEAEA]">
                info
              </span>
              <span>
                화면의 박스를 드래그하거나 클릭하여 위치를 이동할 수 있습니다. (정확한 수치는 좌측 X/Y 입력)
              </span>
            </div>
            {fileBuffer && (
              <span className="text-blue-600 dark:text-blue-400 font-black">
                {totalQuantity}장 연속 생성 준비 완료
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
